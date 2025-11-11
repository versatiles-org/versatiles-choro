<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import { get } from 'svelte/store';

  // Lazy import MapLibre to avoid SSR issues
  let maplibre: typeof import('maplibre-gl') | null = null;
  let map: import('maplibre-gl').Map | null = null;
  let mapContainer: HTMLDivElement | null = null;

  // State
  let loading = false;
  let error: string | null = null;
  let tileSources: Array<{ id: string; name?: string; url?: string; type?: 'vector'|'raster' }>| null = null;
  let tilejson: any = null;

  // Helpers
  const API_BASE = '/api';
  function currentSrcParam(): string | null {
    const url = get(page).url;
    return url.searchParams.get('src');
  }
  function gotoWithSrc(src: string) {
    const url = new URL(get(page).url);
    url.searchParams.set('src', src);
    window.location.href = url.toString();
  }

  async function fetchTileSources() {
    loading = true; error = null;
    try {
      const res = await fetch(`${API_BASE}/tiles`);
      if (!res.ok) throw new Error(`Failed to fetch tile sources: ${res.status}`);
      const data = await res.json();
      // Normalize to expected shape
      tileSources = (Array.isArray(data) ? data : data.items || []).map((d: any) => ({
        id: String(d.id ?? d.name ?? d.path ?? d.file ?? d.url ?? '').trim(),
        name: d.name ?? d.label ?? d.id ?? d.file ?? d.path ?? d.url ?? 'Unknown',
        url: d.url,
        type: d.type
      }));
    } catch (e:any) {
      error = e?.message || String(e);
    } finally {
      loading = false;
    }
  }

  async function fetchTileJSON(src: string) {
    loading = true; error = null; tilejson = null;
    try {
      const u = new URL(`${API_BASE}/tilejson`, window.location.origin);
      u.searchParams.set('src', src);
      const res = await fetch(u);
      if (!res.ok) throw new Error(`Failed to fetch TileJSON for \"${src}\": ${res.status}`);
      tilejson = await res.json();
    } catch (e:any) {
      error = e?.message || String(e);
    } finally {
      loading = false;
    }
  }

  function ensureMap() {
    if (!maplibre || !mapContainer || !tilejson) return;

    // Destroy previous map if any
    if (map) {
      map.remove();
      map = null;
    }

    const isVector = tilejson?.vector_layers || tilejson?.scheme === 'xyz' && !tilejson?.format?.startsWith('png') && !tilejson?.format?.startsWith('jpg') && !tilejson?.tiles?.[0]?.includes('{r}');

    // Basic style skeleton
    const style: any = {
      version: 8,
      glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
      sources: {},
      layers: [
        { id: 'background', type: 'background', paint: { 'background-color': '#f8f9fb' } }
      ]
    };

    if (isVector) {
      style.sources['choro'] = {
        type: 'vector',
        tiles: tilejson.tiles,
        minzoom: tilejson.minzoom ?? 0,
        maxzoom: tilejson.maxzoom ?? 14
      };

      const vLayers: Array<{ id: string }> = tilejson.vector_layers ?? [];
      // Add outline layers for quick preview
      for (const vl of vLayers) {
        style.layers.push({
          id: `choro-${vl.id}-line`,
          type: 'line',
          source: 'choro',
          'source-layer': vl.id,
          paint: {
            'line-color': '#333',
            'line-width': 0.5,
            'line-opacity': 0.8
          }
        });
      }
    } else {
      style.sources['choro'] = {
        type: 'raster',
        tiles: tilejson.tiles,
        tileSize: 256,
        minzoom: tilejson.minzoom ?? 0,
        maxzoom: tilejson.maxzoom ?? 14
      };
      style.layers.push({ id: 'choro-raster', type: 'raster', source: 'choro', paint: { 'raster-opacity': 1 } });
    }

    map = new maplibre.Map({
      container: mapContainer,
      style,
      center: tilejson.center ?? [10.0, 51.0],
      zoom: tilejson.minzoom ?? 4,
      hash: true
    });

    map.addControl(new maplibre.NavigationControl({ visualizePitch: true }), 'top-right');
    if (tilejson?.bounds?.length === 4) {
      const b = tilejson.bounds;
      map.fitBounds([[b[0], b[1]], [b[2], b[3]]], { padding: 24, duration: 0 });
    }
  }

  onMount(async () => {
    // Load MapLibre only in browser
    maplibre = await import('maplibre-gl');

    const src = currentSrcParam();
    if (!src) {
      await fetchTileSources();
      return;
    }
    await fetchTileJSON(src);
    ensureMap();
  });

  onDestroy(() => {
    if (map) {
      map.remove();
      map = null;
    }
  });
</script>

<style>
  .container { display: grid; grid-template-rows: auto 1fr; height: 100%; min-height: 100vh; }
  .toolbar { display: flex; gap: .5rem; align-items: center; padding: .5rem .75rem; border-bottom: 1px solid #e6e8eb; background: #fff; }
  .status { margin-left: auto; color: #6b7280; font-size: .9rem; }
  .grid { padding: 1rem; display: grid; gap: .75rem; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); }
  .card { border: 1px solid #e5e7eb; border-radius: .5rem; background: #fff; padding: .75rem; display:flex; flex-direction:column; gap:.5rem; }
  .map { width: 100%; height: calc(100vh - 56px); }
  button { border: 1px solid #d1d5db; background: #f9fafb; border-radius: .375rem; padding: .4rem .6rem; cursor: pointer; }
  button:hover { background: #f3f4f6; }
</style>

<div class="container">
  <div class="toolbar">
    <strong>Preview Tiles</strong>
    {#if loading}<span class="status">Loading…</span>{/if}
    {#if error}<span class="status" style="color:#b91c1c">{error}</span>{/if}
  </div>

  {#if !currentSrcParam()}
    <!-- No src selected: list available sources -->
    <div class="grid">
      {#if tileSources && tileSources.length}
        {#each tileSources as t}
          <div class="card">
            <div><strong>{t.name}</strong></div>
            <div style="color:#6b7280;font-size:.9rem;">{t.id}</div>
            {#if t.type}<div style="color:#6b7280;font-size:.85rem;">type: {t.type}</div>{/if}
            <div style="margin-top:.25rem"><button on:click={() => gotoWithSrc(t.id)}>Open</button></div>
          </div>
        {/each}
      {:else}
        <div class="card"><em>No tile sources found. Upload or generate tiles first.</em></div>
      {/if}
    </div>
  {:else}
    <!-- Source selected: render map -->
    <div bind:this={mapContainer} class="map"></div>
  {/if}
</div>