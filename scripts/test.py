import csv 
from pathlib import Path


csv_path = Path('../data/tables/salles.csv')

with open(csv_path ,newline='') as csvfile:
     spamreader = csv.reader(csvfile, delimiter=' ', quotechar='|')
     res = list(spamreader)
print(res)
