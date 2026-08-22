# Contributing

Contributions are welcome and will be fully credited.

## Pull requests

- **Add tests** — your patch won't be accepted without tests covering the change.
- **Keep the build green** — run `npm run typecheck`, `npm test`, and `npm run build` before opening a PR.
- **Document behavior changes** — update the relevant file under `docs/` for anything user-facing.
- **One pull request per feature** — if you want to do more than one thing, send multiple pull requests.

## Running the project locally

```bash
npm install
npm test          # run the test suite once
npm run test:watch # watch mode
npm run coverage   # test suite with coverage report
npm run build      # typecheck + build dist/
```

The `examples/` directory has small standalone pages/apps you can open directly to try out changes.

## Reporting issues

Please use the [issue tracker](../../issues) for bugs and feature requests. If you've found a security issue, email [info@javaabu.com](mailto:info@javaabu.com) instead.
