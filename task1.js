const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// URL for the Computer Science (COMP) course descriptions page
const url = 'https://bulletin.du.edu/undergraduate/coursedescriptions/comp/';

axios.get(url)
    .then(response => {
        const $ = cheerio.load(response.data);
        const courses = [];

        // Select course blocks within the course description container.
        $('#coursedescriptionstextcontainer .courseblock').each((i, el) => {
            // Get the course title element
            const titleElem = $(el).find('p.courseblocktitle strong');
            if (!titleElem.length) return;

            // Extract course code and title.
            // Example text: "COMP 3821 Game Programming I  (4 Credits)"
            const fullTitle = titleElem.text().trim();
            const normalized = fullTitle.replace(/\s+/g, ' ');
            // Use regex to capture course code and title.
            const match = normalized.match(/(COMP)\s*([0-9]{4})\s+(.+?)(?=\s+\()/);
            if (!match) return;

            const coursePrefix = match[1];
            const courseNumber = match[2];
            const courseTitle = match[3].trim();

            // Only include upper-division courses (3000-level and above)
            if (parseInt(courseNumber, 10) < 3000) return;

            // Check the description for any indication of prerequisites.
            const descText = $(el).find('p.courseblockdesc').text();
            // Use a regex that matches both "Prerequisite:" and "Prerequisites:" in a case-insensitive way.
            if (/Prerequisite[s]?:/i.test(descText)) return;

            // Format the course code as "COMP-XXXX"
            const formattedCourse = `${coursePrefix}-${courseNumber}`;

            courses.push({
                course: formattedCourse,
                title: courseTitle
            });
        });

        // Define output JSON structure
        const output = { courses };

        // Ensure the results directory exists
        const outputDir = path.join(__dirname, 'results');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir);
        }

        // Write the results to a JSON file
        const outputPath = path.join(outputDir, 'bulletin.json');
        fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
        console.log(`Scraping complete. ${courses.length} courses saved to ${outputPath}`);
    })
    .catch(error => {
        console.error('Error fetching page:', error);
    });
