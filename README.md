# Calling Card
I got a calling card! Six pages of it. A week before valentines. :3 Its was written by a girl i really like. x3 A sadistic, linguisty, computer savvy girl. :[

This is a **nodejs** stab at processing images of handwritten characters.

## The problem 
She made up a code. Hand wrote it on a hard to edge detect background. Curved rows enough to be difficult to process. Picked character shapes that were uneven widths with similar shared structures. And wrote enough quantity to discourage timely manual decoding.
![source example](https://github.com/safetyscissors/calling-card/blob/master/docs/Scan-left-clean2.jpg)

## The solution

This tool first splits out rows. Then splits spaces between characters. Then replaces similar characters with the next available a-z letter. It was able to strongly split out each character but only succeeded identifying similar letters ~61% of the time. But it was enough to solve for basic words like "the", "and", and my name. From the partial text file, I was able to quickly fill in the holes manually. 

The majority of the row/letter splitting was done by graphing distance to white, and taking the peaks. Similar for character identification, a profile was made by making a distance to white graph along the horizontal, and again along the vertical. 
![source example](https://github.com/safetyscissors/calling-card/blob/master/output/test8.jpg)

## Why you want to use this!
- image processing handwritten text. uneven text, with non-grid shaped rows/letters
- unsupported languages/characters like this one she made up.
- no training. (sadly, no learning components)

## You dont want to use this if...
- if its simple, use other peoples npm modules. 
  - if rows are even and dont curve extremely.
  - if letters are typed
  - if letters are english or supported language
  - if letters are handwritten very consistently
- it needs to work. (disclaimer, peak identification rate was ~61%)


## Running it.
Edit index.js. Theres a config object that specifies the input, output, and debug flags for splitting rows, splitting letters, and letter matching. These debug flags stops execution at that point and returns an output image with colored dots marking the pixel ranges that have been identified during those steps

Sorry, It really needs to be cleaned up. If you legitimately are trying to do something similar, I learned a ton. Drop me an email at ati2@hawaii.edu

## The Files
The docs folder has a number of various bw versions of the first page. Mainly used as script inputs. The output folder has outputs from various stages of the program running. Mainly row and letter splits.
