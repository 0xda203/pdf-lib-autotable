const { PDFPage, rgb, StandardFonts, PDFString, PDFName } = require('pdf-lib');

/**
 * This function adds a table to a PDFPage object.
 *
 * @param {Array} headers - An array of strings representing the table headers.
 * @param {Array} rows - A 2D array where each inner array represents a row and each element in the inner array represents a cell.
 * @param {Object} options - An object that can contain several properties to customize the table.
 * @returns {Object} - An object that contain the last page and the Y position where the table ends
 */
PDFPage.prototype.drawTable = async function (headers, rows, options = {}) {
    // Default options for the table, can be overridden by the options parameter
    const {
        margin = {
            top: 10,
            bottom: 50,
            left: 50,
            right: 50,
        },
        fontSize = 14,
        startPosY = 0,
        headerHeight = 20, // Height of the header cells
        borderWidth = 1,
        cellPadding = {
            top: 5,
            bottom: 5,
            left: 5,
            right: 5
        },
    } = options;

    // Embed standard Helvetica font
    const font = await this.doc.embedFont(StandardFonts.Helvetica);
    const boldFont = await this.doc.embedFont(StandardFonts.HelveticaBold);

    // Function to create a new page
    const newPage = () => {
        const nextPage = this.doc.addPage();
        return nextPage;
    };

    // Get the size of the page
    const { width, height } = this.getSize();

    // Calculate the position where the table should start
    const marginTopAdjusted = margin.top + startPosY;
    const startX = margin.left;
    const endX = width - margin.right;
    const startY = startPosY - margin.top;
    const tableStartY = startY - (headers.length > 0 ? headerHeight : 0);

    // Variables to keep track of the current page and the Y position where the next cell should be drawn
    let currentPage = this;
    let currentY = tableStartY;

    // Draw the headers
    for (let i = 0; i < headers.length; ++i) {
        const header = headers[i];
        const cellWidth = (endX - startX) / headers.length; // Calculate cell width based on the number of headers
        const cellStartX = startX + cellWidth * i;

        // Calculate vertical center position for the text
        const textHeight = 10; // Adjust this value based on the font size
        const textY = tableStartY + (headerHeight - textHeight) / 2;

        // Draw the header cells as filled rectangles with black borders
        currentPage.drawRectangle({
            x: cellStartX,
            y: tableStartY,
            width: cellWidth,
            height: headerHeight,
            color: rgb(0.95, 0.95, 0.95),
            borderColor: rgb(0, 0, 0),
            borderWidth,
            fill: true,
        });

        // Draw the text inside the header cell (vertically centered)
        currentPage.drawText(header, {
            x: cellStartX + cellPadding.left,
            y: textY,
            size: fontSize,
            color: rgb(0, 0, 0),
        });
    }

    // Array to store the precalculated row heights
    const rowHeights = [];

    // Calculate the maximum cell height for each row
    for (let i = 0; i < rows.length; ++i) {
        const row = rows[i];
        const numCells = row.length;
        let maxCellHeight = 0; // Maximum height of cells in the current row

        for (let j = 0; j < numCells; ++j) {
            const cellValue = row[j].text || row[j];
            const cellWidth = (endX - startX) / numCells - cellPadding.left - cellPadding.right;
            const wrappedText = wrapTextIntoLines(cellValue, font, row[j].fontSize || fontSize, cellWidth);

            const cellHeight = wrappedText.length * (row[j].fontSize || fontSize) + cellPadding.top + cellPadding.bottom; // Calculate cell height including padding

            if (cellHeight > maxCellHeight) {
                maxCellHeight = cellHeight; // Update maximum cell height in the row
            }
        }

        rowHeights.push(maxCellHeight); // Store the maximum cell height for this row
    }

    // Total height of cells in previous rows
    let totalHeight = 0;

    // Draw rows
    for (let i = 0; i < rows.length; ++i) {
        const row = rows[i];
        const numCells = row.length;
        const cellWidth = (endX - startX) / numCells; // Calculate cell width based on the number of cells in the row
        const maxCellHeight = rowHeights[i];
        totalHeight = maxCellHeight;
        // Check if the row fits on the current page. If not, create a new page and set currentY to the top.
        if (currentY - totalHeight < margin.bottom) {
            currentPage = newPage();
            currentY = currentPage.getSize().height - margin.top;
            totalHeight = maxCellHeight; // Reset totalHeight to the height of the current row after creating a new page
        }

        // Draw cells in the current row
        for (let j = 0; j < numCells; ++j) {
            const cellValue = row[j].text || row[j];
            const cellStartX = startX + cellWidth * j;
            const cellStartY = currentY - totalHeight;  // calculate the start Y position for the cell



            // Draw the cell as a rectangle with black borders and top/bottom padding
            currentPage.drawRectangle({
                x: cellStartX,
                y: cellStartY,
                width: cellWidth,
                height: maxCellHeight,
                borderColor: rgb(0, 0, 0),
                borderWidth: row[j].borderWidth !== undefined ? row[j].borderWidth : borderWidth,
                color: typeof row[j] === 'object' && row[j].backgroundColor ? rgb(...row[j].backgroundColor) : rgb(1, 1, 1),
                fill: false,
            });

            // Wrap text to fit within the cell width and height
            const wrappedText = wrapTextIntoLines(cellValue, font, row[j].fontSize || fontSize, cellWidth - cellPadding.left - cellPadding.right);

            for (let k = 0; k < wrappedText.length; ++k) {
                const line = wrappedText[k];

                const fontHeight = font.heightAtSize(row[j].fontSize || fontSize); // Get the font height at the specified font size
                const baselineOffset = fontHeight * 0.2; // 25% of the font height as baseline offset

                const textWidth = font.widthOfTextAtSize(line, row[j].fontSize || fontSize);

                // Calculate text position with padding from left, top, and right
                let textX = cellStartX + cellPadding.left;
                const textY = cellStartY + maxCellHeight - cellPadding.top - ((row[j].fontSize || fontSize) * (k + 1) - baselineOffset);

                // Center the text if align property is set to 'center'
                if (typeof row[j] === 'object' && row[j].align === 'center') {
                    const cellContentWidth = cellWidth - cellPadding.left - cellPadding.right;
                    const centeredTextX = cellStartX + (cellContentWidth - textWidth) / 2;
                    textX = centeredTextX;
                }

                // Draw the text
                currentPage.drawText(line, {
                    x: textX,
                    y: textY,
                    size: (row[j].fontSize || fontSize),
                    color: typeof row[j] === 'object' && row[j].foregroundColor ? rgb(...row[j].foregroundColor) : rgb(0, 0, 0),
                    font: typeof row[j] === 'object' && row[j].bold ? boldFont : font,
                });

            }
        }

        // Update currentY after processing each row
        currentY -= totalHeight;
    }

    // Return the last page and the Y position where the table ends
    return { lastPage: currentPage, endY: currentY };
};

/**
 * This function wraps a given text into lines so that each line fits within a specified width.
 *
 * @param {string} text - The text to be wrapped into lines.
 * @param {PDFont} font - The font to be used for the text.
 * @param {number} fontSize - The size of the font.
 * @param {number} maxWidth - The maximum width for each line.
 * @returns {string[]} - An array of strings, each representing a line of text that fits within the specified width.
 */
function wrapTextIntoLines(text, font, fontSize, maxWidth) {
    let lines = []; // Array to store the lines
    let currentLine = ''; // The current line being built
    let words = text.split(' '); // Split the text into words

    for (let i = 0; i < words.length; i++) {
        let currentWord = words[i]; // The current word
        let currentWordWidth = font.widthOfTextAtSize(currentWord, fontSize); // The width of the current word at the specified font size

        // Check if the current word can be added to the current line
        if (currentLine !== '' && font.widthOfTextAtSize(currentLine + ' ' + currentWord, fontSize) <= maxWidth) {
            if (currentLine !== '') {
                currentLine += ' '; // Add a space before the word if the current line is not empty
            }
            currentLine += currentWord; // Add the current word to the current line
        } else {
            // If the current word can't be added to the current line, push the current line to the lines array
            if (currentLine !== '') {
                lines.push(currentLine);
                currentLine = ''; // Clear the current line
            }

            // If the current word fits within the maximum width, add it to the current line
            if (currentWordWidth <= maxWidth) {
                currentLine = currentWord;
            } else {
                /// If the current word is longer than the maximum width, split it into multiple lines
                let wordPart = currentWord;
                let startIndex = 0;
                while (startIndex < wordPart.length) {
                    let partWidth = font.widthOfTextAtSize(wordPart.slice(0, startIndex + 1), fontSize);
                    if (partWidth <= maxWidth) {
                        startIndex++;
                    } else {
                        lines.push(wordPart.slice(0, startIndex)); // Add the part of the word that fits to the lines array
                        wordPart = wordPart.slice(startIndex); // Update the word part to the remaining text
                        startIndex = 0; // Reset the start index
                    }
                }

                // If there's any remaining part in the wordPart, add it to the lines array
                if (wordPart !== '') {
                    lines.push(wordPart);
                }

                currentLine = '';
            }
        }
    }

    // If there's any remaining text in the current line, add it to the lines array
    if (currentLine !== '') {
        lines.push(currentLine);
    }

    return lines; // Return the array of lines
}
