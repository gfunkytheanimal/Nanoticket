# NanoTicket Release Checklist

## Preflight

```bash
npm test
npm pack --dry-run
```

Confirm the dry run includes only:

- `bin/nanoticket.js`
- `templates/*`
- `examples/*`
- `README.md`
- `LICENSE`
- `package.json`

## Local tarball test

```bash
npm pack
npm install -g ./gfunkytheanimal-nanoticket-0.1.3.tgz
nanoticket help
nanoticket init
nanoticket new "Smoke test"
```

On Windows PowerShell:

```powershell
nanoticket.cmd help
```

## Publish

```bash
npm login
npm publish --access public
```

Scoped packages such as `@gfunkytheanimal/nanoticket` need `--access public` for public publishing.

## Post-publish smoke test

```bash
npm uninstall -g @gfunkytheanimal/nanoticket
npm install -g @gfunkytheanimal/nanoticket
nanoticket help
```
