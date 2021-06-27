/*eslint-disable*/
export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoiZ2FqZXRvIiwiYSI6ImNrcHB4NzNyMzA2c3IzMHA3ZWU4cXhmcnEifQ.2rvFQvQKX1DwAB8SsROPtg';

  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/gajeto/ckppxx4vy0eoq17qji172egq0/draft',
    scrollZoom: false,
    //center: [-118.113491, 34.111745],
    //zoom: 5,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    console.log(loc.day);

    //Create marker
    const el = document.createElement('div');
    el.className = 'marker'; //class instyle.css

    //Add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    //Add popup info
    new mapboxgl.Popup({ offset: 30 })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    //Extend map bounds to fit locations
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};
