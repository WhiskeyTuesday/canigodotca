# Can I Go?

**[canigo.ca](https://canigo.ca)** tracks days outside a Canadian province or
territory to help monitor healthcare eligibility and US substantial presence for
tax purposes as well as visa limits.

## What it does

Canadian provincial healthcare requires you to be physically present in your
home province for a minimum number of days per calendar year. If you travel
frequently (snowbirding, business trips, extended vacations) it's easy to lose
track. There's also tax and visa timelines and they're all subtly different. I
made this thing to get a rough idea

Can I Go? helps you:

- **Track trips** with departure/return dates and multi-leg destinations
- **Monitor provincial healthcare eligibility** against your province's threshold (183 or 212 days depending on province)
- **Calculate US substantial presence** using the IRS 3-year weighted formula (current year + 1/3 prior year + 1/6 two years ago)
- **Check B1/B2 visa compliance** with a rolling 365-day window (180-day guideline)
- **Project future trips** to see if a planned trip would push you past any threshold before you book

All data stays in your browser (localStorage). You can also export/import as JSONL files.

## Tech stack

- [Svelte 5](https://svelte.dev) (runes: `$state`, `$derived`)
- [SvelteKit](https://svelte.dev/docs/kit)
- [TailwindCSS 4](https://tailwindcss.com)
- [Lucide Icons](https://lucide.dev)
- [Vite](https://vite.dev)
- TypeScript
- [Vitest](https://vitest.dev) for testing

## Development

```bash
npm install          # Install dependencies
npm run dev          # Dev server
npm run build        # Production build
npm run preview      # Preview production build
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run check        # TypeScript + Svelte type checking
```

## Built with Claude

The majority of the code in this project was written by Claude. Do with that
information what you will. Take the disclaimer that much more seriously.

## Disclaimer

**This tool is for informational purposes only and does not constitute legal,
tax, or medical advice, or advice of any kind.** Rules may change without
notice. Always verify with official government sources and consult a qualified
professional before making decisions based on this information.

Provincial healthcare eligibility rules are simplified representations. The
actual rules may have additional conditions, exceptions, or nuances not captured
here. Each dashboard card links to the relevant official government source.

The US substantial presence test calculation is a simplified estimate. Consult a
tax professional or the IRS directly for definitive guidance on your tax
obligations.

## License

MIT
