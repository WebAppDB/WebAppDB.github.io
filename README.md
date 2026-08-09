# WebAppDB

WebAppDB is a browser-based launcher for web applications. It loads its app list from a Google Sheets source and presents apps as cards that can be viewed, launched, or favorited.

## Usage

- Open `index.html` in a browser or host this folder on a static web server.
- The app list is dynamically loaded from the spreadsheet at:
  - `https://docs.google.com/spreadsheets/d/19-nT1W50rhmR9bMMIoiW7UAgM0jAZKXdZGrXnMk_A5g/gviz/tq?tqx=out:json`
- App cards show the title and short description.
- Use `View` to expand a card inline for the long description and submitter email.
- Use `Launch` to start the app immediately.
- Use the favorite button to save apps locally.

## Add a new app

To add a new app to the page:

1. Use the official template repository:
   - `https://github.com/WebAppDB/WebAppTemplate`
2. Implement your app by extending `WebAppDBEngine/api/v01/WebAppBaseClass.mjs`.
3. Add the app metadata to the shared spreadsheet.
4. Submit the app through the form:
   - `https://forms.gle/qFCtnZzGApUmEZHf6`

## App metadata mapping

The Sheet columns are mapped to these app fields:

- `Title` → `title`
- `Description` → `description`
- `LongDescription` → `longDescription`
- `Icon` → `icon`
- `Module` → `module`
- `CSS` → `css`
- `Email` → `email`
- `Timestamp` → `timestamp`

`What's New` is populated by sorting apps by `timestamp` descending.

## Files of interest

- `modules/WebAppDB.mjs` — page rendering, app loading, sheet parsing, and card actions
- `css/WebAppDB.css` — card layout, inline expansion, and responsive grid styles
- `WebAppDBEngine/api/v01/WebAppBaseClass.mjs` — base app class for WebAppDB apps
- `demoApps/` — example app implementations used by the page

## Reference

- Demo apps source: `https://github.com/WebAppDB/WebAppDB.github.io/tree/main/demoApps`
- Template repo: `https://github.com/WebAppDB/WebAppTemplate`
