# R Language Benchmark Setup

## Overview
R language support was added in v6.10.10 with full support for:
- `source()` file imports
- Namespace (`package::function`) resolution
- Case-insensitive path handling (Windows compatibility)

## How to Add R Repositories to Benchmarks

### Option 1: Clone Popular R Packages (Recommended)

Popular R packages that would be good benchmarks:

```bash
# Statistical/data analysis packages
git clone https://github.com/tidyverse/tidyverse.git benchmarks/repos/tidyverse
git clone https://github.com/tidyverse/ggplot2.git benchmarks/repos/ggplot2
git clone https://github.com/tidyverse/dplyr.git benchmarks/repos/dplyr

# Web framework
git clone https://github.com/rstudio/shiny.git benchmarks/repos/shiny

# Data science toolkit
git clone https://github.com/pandas-profiling/pandas-profiling.git (Note: this is Python, not R)
```

### Option 2: Use Existing R Fixtures

The test suite includes an R package fixture at `test/fixtures/r-package/` that can be used for quick validation:

```bash
# Copy fixture to benchmarks
cp -r test/fixtures/r-package benchmarks/repos/r-test-package
```

### Updating task-metadata.json

Once you add an R repository, register it in `benchmarks/task-metadata.json`:

```json
{
  "tasks": {
    "shiny": {
      "language": "r",
      "repo_type": "framework",
      "size_class": "medium",
      "description": "Shiny web framework for R"
    },
    "ggplot2": {
      "language": "r",
      "repo_type": "library",
      "size_class": "medium",
      "description": "ggplot2 graphics library"
    },
    "dplyr": {
      "language": "r",
      "repo_type": "library",
      "size_class": "medium",
      "description": "dplyr data manipulation"
    }
  }
}
```

## R Language Support Verification

### What Works
✅ R file detection (`.r`, `.R` extensions)  
✅ `source("file.R")` import resolution  
✅ `library(pkg)` and `pkg::function` detection  
✅ Local package namespace resolution  
✅ DESCRIPTION file parsing  
✅ NAMESPACE file parsing  
✅ Windows path normalization (lowercase handling)  
✅ R/utils.R, R/zzz.R, R/globals.R hub file recognition  

### Known Limitations
- External package imports (`pkg::fn` references to external packages) are not resolved to file paths
- R script-only projects (without DESCRIPTION) may have limited dependency tracking
- Library imports are detected but not resolved to external package locations

### Running R Language Tests

```bash
# Run R language-specific tests
node test/r-language.test.js

# Run all tests including R
node test/integration/all.js

# Test Windows path normalization
node test/windows-path-normalization.test.js
```

## Benchmark Metrics Expected

For typical R packages:
- **Hit@5** (retrieval accuracy): 70-85% (R is a smaller language community)
- **Token reduction**: 50-70% (R files tend to be smaller than large JS/Python projects)
- **Task success**: 40-55% (lower than JS/Python due to simpler package structures)

## Contributing R Repositories

If you add new R repositories to the benchmarks:

1. Ensure the repository has a valid DESCRIPTION file for context extraction
2. Test with `node gen-context.js` to verify extraction works
3. Document the repository's characteristics in task-metadata.json
4. Run `node test/windows-path-normalization.test.js` to verify cross-platform handling
5. Update this file with findings and suggestions

## Related Documentation

- [R Manifest Parser](../src/discovery/r-manifest.js)
- [Graph Builder R Support](../src/graph/builder.js) - R import extraction
- [Impact Analysis](../src/graph/impact.js) - Dependency impact calculation
- [Windows Path Normalization Tests](../test/windows-path-normalization.test.js)
