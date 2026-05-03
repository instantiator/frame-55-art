# Frame 55 Art

A collection of scripts and utilities for retrieving, resizing, and managing high-resolution artwork, primarily intended for display on digital canvases like the Samsung The Frame TV (55").

I created this tool to work with the Frame 55, but if you know the dimensions of your display you can reconfigure the app to resize the art for it.

> [!NOTE]
> Contributions welcome! Please submit your display dimensions as a pull request modification to `dimensions.json`

> [!WARNING]
> The scripts in this repository expect `bash` and `npm` to be present on your system, and I've written them to run on Mac OS. Your mileage may vary on other operating systems! Again, all contributions are welcome.

> [!CAUTION]
> Please don't use these tools to swamp Wikimedia with requests.

## Project Structure

This repository contains several tools to automate the process of finding and preparing art:

- **`retrieve-art/`**: An application to search Wikidata for artists and automatically download their high-resolution public domain artwork from Wikimedia Commons.
  - [View the `retrieve-art` documentation](./retrieve-art/README.md)
- **`retrieve-art.sh`**: A shell script that invokes the `retrieve-art` application.
- **`resize-art.sh`**: A shell script to crop and resize the downloaded images to fit the specific aspect ratio and resolution requirements of the display.
- **`art/`**: The directory structure intended for storing the source (`art/source`) and processed (`art/output`) images.
- **`data/`**: Configuration files (eg. `dimensions.json` to describe display dimensions)

## Getting Started

A couple of scripts will help you.

| Script | Purpose |
|-|-|
| `retrieve-art.sh` | Searches for artist information to help you identify their id. Retrieves art if the artist's id is specified. |
| `resize-art.sh` | Resizes art to the dimensions of your display. Uses the equivalent of css `object-fit: cover` to scale and crop the art. |

### Download art

First, get the id of an artist by passing a name to the `retrieve-art` module:

```sh
$ ./retrieve-art.sh -n "Van Gogh"
┌─────────┬──────────────┬──────────────────────────┬─────────────────────────────────────────┐
│ (index) │ id           │ label                    │ description                             │
├─────────┼──────────────┼──────────────────────────┼─────────────────────────────────────────┤
│ 0       │ 'Q5582'      │ 'Vincent van Gogh'       │ 'Dutch painter (1853–1890)'             │
│ 1       │ 'Q42865365'  │ 'van Gogh'               │ 'family name'                           │
│ 2       │ 'Q84161251'  │ 'Van Gogh National Park' │ 'national park in the Netherlands'      │
│ 3       │ 'Q119625610' │ 'Van Gogh'               │ 'family name'                           │
│ 4       │ 'Q224124'    │ 'Van Gogh Museum'        │ 'art museum in Amsterdam, Netherlands'  │
│ 5       │ 'Q1272723'   │ 'Van Gogh'               │ 'Serbian (formerly Yugoslav) rock band' │
│ 6       │ 'Q2509824'   │ 'Van Gogh'               │ '1948 film by Alain Resnais'            │
└─────────┴──────────────┴──────────────────────────┴─────────────────────────────────────────┘
```

Here, it's `Q5582`. Then pass the id to retrieve their art, held by Wikimedia.

```sh
$ ./retrieve-art.sh -i "Q5582"
Found 1151 pieces for artist: Vincent van Gogh
[1/1151] Downloading: Basket of Hyacinth Bulbs ...
[2/1151] Downloading: Flowerpot with Garlic Chives ...
[3/1151] Downloading: Dish with Citrus Fruit ...
[4/1151] Downloading: Carafe and Dish with Citrus Fruit ...
...
```

It'll print a summary of all art downloaded when finished.

> [!TIP]
> You can limit the number of items downloaded (eg. when testing this script) by passing in a limit value, eg. `-l 3`.

Take a look inside the `art/source/` directory to locate the downloaded art.

Once you have some art, resize it to fit your display with the `resize-art.sh` script, eg.

```sh
$ ./resize-art.sh -s "art/source/Q5582 Vincent van Gogh"
```

The resized art will appear in the `art/output/Samsung Frame 55"` directory. 

> [!TIP]
> By default, this script uses the Samsung Frame 55 device specifications. You can specify another by modifying `data/dimensions.json` and then providing the device path with the device parameter, eg.
>
> ```sh
> $ ./resize-art.sh -s "art/source/Q5582 Vincent van Gogh" -d ".samsung.frame55"
> ```

## Further information

To find out more about downloading the art, check out the [retrieve-art module instructions](./retrieve-art/README.md).

To see all options, use the `-h` or `--help` parameter with either script.