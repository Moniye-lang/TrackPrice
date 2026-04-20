
import fs from 'fs';

const content = fs.readFileSync('c:\\Users\\HP\\Desktop\\FRONTEND\\Hyperlinks\\Testing_1-2\\track-price\\src\\app\\forum\\page.tsx', 'utf8');

function countTags(content) {
    let openDivs = 0;
    let closeDivs = 0;
    let openSections = 0;
    let closeSections = 0;
    let openMains = 0;
    let closeMains = 0;

    // Simple regex-based count (might be flawed due to comments/strings but good enough for a check)
    openDivs = (content.match(/<div(\s|>)/g) || []).length;
    closeDivs = (content.match(/<\/div>/g) || []).length;
    openSections = (content.match(/<section(\s|>)/g) || []).length;
    closeSections = (content.match(/<\/section>/g) || []).length;
    openMains = (content.match(/<main(\s|>)/g) || []).length;
    closeMains = (content.match(/<\/main>/g) || []).length;

    console.log(`Divs: ${openDivs} open, ${closeDivs} close. Delta: ${openDivs - closeDivs}`);
    console.log(`Sections: ${openSections} open, ${closeSections} close. Delta: ${openSections - closeSections}`);
    console.log(`Mains: ${openMains} open, ${closeMains} close. Delta: ${openMains - closeMains}`);
}

countTags(content);
