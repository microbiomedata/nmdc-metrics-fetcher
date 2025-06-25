# ORCID

This directory contains miscellaneous scripts you can use to fetch data about NMDC's use of ORCID.

## `analyze_affiliations.py`: Analyze raw affiliation data exported from ORCID Member Portal

This script can be used to parse a "raw data" CSV file exported from the ORCID Member Portal. The script counts the number of "Records" (i.e. ORCIDs) that are associated with US National Labs, and the number of "Records" that are _not_ associated with US National Labs.

### Prerequisites

- Update the file path in `csv_file` (near the bottom of the script), so that it points to the input file.

## `nmdc-orcid-info.ipynb`: Fetch and analyze user organization data from ORCID Member API

### Prerequisites

- Enter the ORCID Client ID and ORCID Client Secret in the first cell of the notebook.

### Inputs

- `orcids.csv`: List of ORCIDs, with one ORCID per line; for example:
  ```csv
  0000-0000-0001-0000
  0000-0000-0002-0100
  0000-0000-0001-0003
  ```

### Outputs

- `orcid_data.csv`; Table of organization data; for example:
  ```csv
  0000-0000-0001-0000, Joe Cool, [Peanuts University, Global Institute of Globes]
  0000-0000-0002-0100, Unaffiliated User, []
  ```