import fetch from 'node-fetch';
import fs from 'fs';

async function run() {
    try {
        const response = await fetch('https://chowdeck.com/store/gbagada/local-market/sabo-market-somolur4889c', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const text = await response.text();
        fs.writeFileSync('scratch/chowdeck_sabo.html', text);
        console.log('Saved Chowdeck HTML to scratch/chowdeck_sabo.html');
    } catch (error) {
        console.error(error);
    }
}
run();
