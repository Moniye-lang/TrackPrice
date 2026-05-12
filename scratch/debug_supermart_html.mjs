import fetch from 'node-fetch';

async function debugSupermart() {
    const url = 'https://www.supermart.ng/collections/fresh-food';
    console.log(`Fetching ${url}...`);
    
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
            }
        });
        const html = await res.text();
        
        console.log('HTML Length:', html.length);
        
        // Search for product titles to see if they are in the HTML
        const commonProducts = ['Tomato', 'Onion', 'Beef', 'Chicken', 'Egg'];
        for (const p of commonProducts) {
            const index = html.toLowerCase().indexOf(p.toLowerCase());
            console.log(`Searching for "${p}": ${index !== -1 ? 'Found at ' + index : 'Not found'}`);
        }
        
        // Search for potential JSON data
        const jsonMatches = html.match(/window\.\w+\s*=\s*(\{.*?\});/g);
        console.log('Found potential JSON assignments:', jsonMatches?.length || 0);

        // Search for grid items
        const gridItemMatches = html.match(/class="[^"]*grid__item[^"]*"/g);
        console.log('Found grid__item matches:', gridItemMatches?.length || 0);

        // Save a snippet of the HTML for manual inspection
        const snippet = html.substring(0, 5000);
        console.log('HTML Snippet (first 1000 chars):');
        console.log(snippet.substring(0, 1000));

    } catch (err) {
        console.error('Error:', err.message);
    }
}

debugSupermart();
