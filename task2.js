const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs-extra');

async function scrapeDUAthletics() {
    try {
        // Fetch the HTML of the page
        const { data } = await axios.get('https://denverpioneers.com/index.aspx');

        // Load the HTML into Cheerio
        const $ = cheerio.load(data);

        // Extract the JSON object from the script tag
        const scriptContent = $('section[aria-labelledby="h2_scoreboard"] script').html();
        const jsonString = scriptContent.match(/var obj = (\{.*\});/)[1];
        const eventData = JSON.parse(jsonString);

        // Extract the relevant data
        const events = eventData.data.map(event => ({
            duTeam: event.sport?.title || "Unknown DU Team",  // Extract DU Team Name
            opponent: event.opponent?.title || "Unknown Opponent",  // Extract Opponent Team Name
            date: event.date || "Unknown Date"  // Extract Event Date
        }));

        // Save the extracted data into a JSON file
        const output = { events };
        await fs.writeJson('results/athletic_events.json', output, { spaces: 2 });

        console.log("Data successfully saved to results/athletic_events.json");

    } catch (error) {
        console.error('Error fetching or parsing data:', error);
    }
}

// Run the scraper
scrapeDUAthletics();
