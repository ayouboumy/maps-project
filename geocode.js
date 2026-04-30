import https from 'https';

const communes = [
  "Driouch", "Ben Taieb", "Midar", "Ain Zohra", "Ait Mait", "Amejjaou", "Azlaf", 
  "Bni Marghnin", "Bni Oukil Oulad M'Hand", "Boudinar", "Dar El Kebdani", "Iferni", 
  "Ijermaouas", "Mtalsa", "Ouardana", "Oulad Amghar", "Oulad Boubker", "Tafersit", 
  "Temsamane", "Trougout", "Tsaft", "Izaoumene", "Amhajir"
];

async function geocode(name) {
  return new Promise((resolve) => {
    const query = encodeURIComponent(`${name} province Driouch`);
    https.get(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`, {
      headers: { 'User-Agent': 'MosqueApp/1.0' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.length > 0) resolve({ name, lat: json[0].lat, lon: json[0].lon });
          else {
            // fallback search without province Driouch
            const query2 = encodeURIComponent(`${name} Morocco`);
            https.get(`https://nominatim.openstreetmap.org/search?q=${query2}&format=json&limit=1`, {
                headers: { 'User-Agent': 'MosqueApp/1.0' }
              }, (res2) => {
                let data2 = '';
                res2.on('data', chunk => data2 += chunk);
                res2.on('end', () => {
                    const json2 = JSON.parse(data2);
                    if (json2.length > 0) resolve({ name, lat: json2[0].lat, lon: json2[0].lon });
                    else resolve({ name, lat: null, lon: null });
                });
            });
          }
        } catch(e) { resolve({ name, lat: null, lon: null }); }
      });
    });
  });
}

async function run() {
  for (const c of communes) {
    const res = await geocode(c);
    console.log(`"${c}": { latitude: ${res.lat}, longitude: ${res.lon} },`);
    await new Promise(r => setTimeout(r, 1500));
  }
}
run();
