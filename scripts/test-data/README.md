# QA test datasets

`--dataset=test-paging` builds ≥65 timeline cards for infinite-scroll QA.

```bash
npm run build -- --dataset=test-paging
```

These cards stay in `scripts/test-data/` and the test build only. They must not appear in the public `dist/` of `main`.
