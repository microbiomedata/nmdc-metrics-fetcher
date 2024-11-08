## Notebook to fetch user organizations from orcid member API

You will need to enter the client ID and secret in the first cell for this to work

Inputs: orcids.csv - List of orcids, with one orcid per line
eg.:
```
0000-0000-0001-0000
0000-0000-0002-0100
0000-0000-0001-0003
```

Outputs: orcid_data.csv
eg. row:
```
0000-0000-0001-0000, Joe Cool, [Peanuts University, Global Institute of Globes]
0000-0000-0002-0100, Unaffiliated User, []
```
