# pdf-lib-autotable

## Overview

`pdf-lib-autotable` is a simple extension to the [pdf-lib](https://github.com/Hopding/pdf-lib) library, providing an easy-to-use interface for creating basic tables in your PDF documents. This library takes inspiration from `jspdf-autotable`, a well-regarded plugin for the jsPDF library, and seeks to provide similar functionality for users of `pdf-lib`.

This library is designed to make it easy for developers to add structured data to their PDF documents, without needing to manually calculate positions for each cell. `pdf-lib-autotable` handles the heavy lifting, allowing you to focus on the content.

## Installation

Install the package via npm:

```bash
npm install 0xda203/pdf-lib-autotable
```

## Usage

First, import the pdf-lib and pdf-lib-autotable packages:

```javascript
const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");
require("pdf-lib-autotable");
```

Then, you can use the drawTable method on any PDFPage object:

```javascript
const doc = await PDFDocument.create();
const page = doc.addPage();

const headers = ["Header 1", "Header 2", "Header 3"];
const rows = [
  ["Row 1 Cell 1", "Row 1 Cell 2", "Row 1 Cell 3"],
  ["Row 2 Cell 1", "Row 2 Cell 2", "Row 2 Cell 3"],
  // More rows...
];

await page.drawTable(headers, rows, {
  startPosY: 500
});
```

This will create a table at the specified coordinates with the provided headers and rows.

For more information on the available options, please refer to the API documentation.

## Options

The `drawTable` method accepts an optional third argument, which is an object that can include the following properties:

- `startPosY`: The Y-coordinate at which to start drawing the table. Default is `0`.

- `margin`: An object that specifies the margins around the table. It can have the following properties: `top`, `right`, `bottom`, `left`. Default is `{ top: 0, right: 0, bottom: 0, left: 0 }`.

- `fontSize`: The font size of the text in the table. Default is `14`.

- `headerHeight`: The height of the header cells. Default is `20`.

- `borderWidth`: The width of the border lines. Default is `1`.

- `cellPadding`: An object that specifies the padding inside the cells. It can have the following properties: `top`, `right`, `bottom`, `left`. Default is `{ top: 5, right: 5, bottom: 5, left: 5 }`.

Each row in the `rows` argument can be an array of strings or an array of objects. If it's an array of objects, each object can have the following properties:

- `text`: The text to be displayed in the cell.

- `bold`: A boolean that specifies whether the text should be bold. Default is `false`.

- `align`: The alignment of the text. Can be `'left'`, `'right'`, or `'center'`. Default is `'left'`.

- `backgroundColor`: The background color of the cell. Should be an array representing an RGB color (for example, `[0.8, 0.8, 0.8]` for light gray).

- `foregroundColor`: The color of the text in the cell. Should be an array representing an RGB color (for example, `[0.5, 0.5, 0.5]` for medium gray).

Please note that the default values mentioned above apply only if the property is not specified in the options object or in the cell object. If a property is specified, its value will be used.

```javascript
const headers = ["Header 1", "Header 2"];
const rows = [
  [
    { text: "Bold text", bold: true },
    { text: "Centered text", align: "center" },
  ],
  [
    { text: "Background color", backgroundColor: [0.8, 0.8, 0.8] },
    { text: "Foreground color", foregroundColor: [0.5, 0.5, 0.5] },
  ],
];

const options = {
  startPosY: 600,
  margin: { top: 10, bottom: 50, left: 50, right: 50 },
  fontSize: 16,
  headerHeight: 25,
  borderWidth: 2,
  cellPadding: { top: 10, bottom: 10, left: 10, right: 10 },
};

await page.drawTable(headers, rows, options);
```

## Return Value

The `drawTable` method returns an object that includes the following properties:

- `lastPage`: A reference to the last `PDFPage` where the table was drawn. If the table spans multiple pages, this will be a reference to the newly created page.

- `endY`: The Y position where the table ends. This can be useful if you want to continue adding content below the table.

Here's an example of how you can use these return values:

```javascript
const result = await page.drawTable(headers, rows, options);

// result.lastPage is a reference to the last page where the table was drawn
// result.endY is the Y position where the table ends

// You can use these values to continue adding content to the PDF
result.lastPage.drawText("Text below the table", {
  x: 50,
  y: result.endY - 50,
  size: 14,
  color: rgb(0, 0, 0),
});
```

## Contributing

Contributions to pdf-lib-autotable are always welcome. If you have found a bug or have a feature request, please open an issue on the GitHub repository. If you want to contribute code, please create a pull request.
