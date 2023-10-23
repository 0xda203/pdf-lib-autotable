const fs = require('fs');
const path = require('path');
const { PDFDocument, } = require('pdf-lib');
require('../index.js')

describe('drawTable', () => {
    let doc;
    let page;
    let headers;
    let rows;
    let options;

    beforeEach(async () => {
        doc = await PDFDocument.create();
        page = doc.addPage();
        headers = ['Header 1', 'Header 2'];
        rows = [
            ['Row 1 Cell 1', 'Row 1 Cell 2'],
            ['Row 2 Cell 1', 'Row 2 Cell 2'],
        ];
        options = {
            margin: { top: 10, bottom: 50, left: 50, right: 50 },
            fontSize: 14,
            startPosY: 0,
            headerHeight: 20,
            borderWidth: 1,
            cellPadding: { top: 5, bottom: 5, left: 5, right: 5 },
        };
    });

    it('should handle cell options (background color, foreground color, alignment, bold)', async () => {
        const cellOptionsRow = [
            { text: 'Bold text', bold: true },
            { text: 'Centered text', align: 'center' },
            { text: 'Text with background color', backgroundColor: [0.8, 0.8, 0.8] },
            { text: 'Text with foreground color', foregroundColor: [0.5, 0.5, 0.5] },
        ];
        rows.push(cellOptionsRow);

        await page.drawTable(headers, rows, options);

        expect(async () => {
            const pdfBytes = await doc.save();

            // Save the PDF into the output folder
            fs.writeFileSync(path.join(__dirname, '../output/test_cell_options.pdf'), pdfBytes);
        }).not.toThrow();
    });

    it('should create new pages as needed', async () => {
        rows = Array(100).fill(['Long text 1', 'Long text 2']); // A large number of rows

        await page.drawTable(headers, rows, options);

        const pdfBytes = await doc.save();
        const loadedDoc = await PDFDocument.load(pdfBytes);
        const pageCount = loadedDoc.getPages().length;

        // Verify that new pages were created
        expect(pageCount).toBeGreaterThan(1);

        // Save the PDF into the output folder
        fs.writeFileSync(path.join(__dirname, '../output/test_new_pages.pdf'), pdfBytes);
    });

    it('should create correct number of pages when text does not fit on one page', async () => {
        // Given rows that should create more than one page
        const longRows = [...Array(100)].map(() => ['Long text 1', 'Long text 2']);

        await page.drawTable(headers, longRows, options);

        // Save the PDF to get the number of pages
        const pdfBytes = await doc.save();
        const loadedDoc = await PDFDocument.load(pdfBytes);

        // We can't know exactly how many pages should be created, but we know it should be more than one
        expect(loadedDoc.getPages().length).toBeGreaterThan(1);

        // Save the PDF into the output folder
        fs.writeFileSync(path.join(__dirname, '../output/test_page_count.pdf'), pdfBytes);
    });

    it('should handle an empty array of rows', async () => {
        rows = []; // No rows

        await page.drawTable(headers, rows, options);

        expect(async () => {
            const pdfBytes = await doc.save();

            // Save the PDF into the output folder
            fs.writeFileSync(path.join(__dirname, '../output/test_empty_rows.pdf'), pdfBytes);
        }).not.toThrow();
    });

    it('should handle rows containing different numbers of cells', async () => {
        rows = [
            ['Row 1 Cell 1', 'Row 1 Cell 2'],
            ['Row 2 Cell 1'],
        ]; // Second row contains only one cell

        await page.drawTable(headers, rows, options);

        expect(async () => {
            const pdfBytes = await doc.save();

            // Save the PDF into the output folder
            fs.writeFileSync(path.join(__dirname, '../output/test_different_number_of_cells.pdf'), pdfBytes);
        }).not.toThrow();
    });

});