import https from 'https';
https.get('https://fr.wikipedia.org/wiki/Province_de_Driouch', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    let html = data.split('D\u00E9coupage territorial')[1] || '';
    const names = [];
    const regex = /title="([^"]+)"/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
      names.push(match[1]);
    }
    console.log(names.slice(0, 50).join('\n'));
  });
});
