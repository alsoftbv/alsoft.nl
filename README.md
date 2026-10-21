# alsoft.nl

Website for [alsoft.nl](https://alsoft.nl)

## Usage
Install dependencies with
`npm i` and run the development server with `npm run dev`

## Build
Built using [Astro](https://astro.build).
## Test
Every push and pull request runs `npm test` in CI before deploying. It checks each page for console errors, horizontal overflow, broken images and em dashes, tests the CRA self-check and SBOM viewer, and compares screenshots against the baselines in `tests/__screenshots__`.

Run it locally after `npm run build`. Screenshot baselines are rendered on Linux, so after an intentional visual change regenerate them in the same container CI uses (requires Docker):

```
npm run test:update
```
