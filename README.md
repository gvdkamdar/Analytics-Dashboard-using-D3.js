# Spotify Data Dashboard Analysis 🎵

## Overview
This repository contains an analysis of Spotify's most popular songs from 2023. The dataset includes detailed information about tracks, including musical attributes, streaming statistics, and chart performances across different platforms.

## Dataset Information 📊

The dataset (`spotify-2023.csv`) includes:
- 🎵 Track details (name, artist(s), release date)
- 📈 Streaming performance metrics
- 🎹 Musical characteristics (BPM, key, mode)
- 📊 Platform-specific metrics (Spotify, Apple Music, Deezer, Shazam)

### Key Features
- Track name and artist(s)
- Release information
- Streaming counts
- Playlist presence
- Chart positions
- Musical attributes (danceability, valence, energy, etc.)

## Requirements 🛠️

To run the analysis, you'll need:
```python
pandas==1.5.3
numpy==1.24.3
matplotlib==3.7.1
seaborn==0.12.2
```

## Installation & Setup 💻

1. Clone this repository:
```bash
git clone https://github.com/yourusername/spotify-2023-analysis.git
cd spotify-2023-analysis
```

2. Create and activate a virtual environment (optional but recommended):
```bash
# For Windows
python -m venv venv
.\venv\Scripts\activate

# For macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

3. Install required packages:
```bash
pip install -r requirements.txt
```
3. Running the code:
```bash
python3.13 -m http.server 3000 
```

## Usage 🚀

1. Place the `spotify-2023.csv` file in the `data` directory
2. Run the analysis notebook:
```bash
jupyter notebook spotify_analysis.ipynb
```

## Data Insights 📈

The analysis reveals:
- Most streamed artists and songs
- Popular musical characteristics
- Temporal trends in music popularity
- Collaboration patterns
- Cross-platform performance metrics

## File Structure 📁
```
spotify-2023-analysis/
│
├── data/
│   └── spotify-2023.csv
│
├── notebooks/
│   └── spotify_analysis.ipynb
│
├── requirements.txt
├── README.md
└── .gitignore
```

## Contributing 🤝

1. Fork the repository
2. Create a new branch (`git checkout -b feature/analysis`)
3. Make your changes
4. Commit your changes (`git commit -am 'Add new analysis'`)
5. Push to the branch (`git push origin feature/analysis`)
6. Create a Pull Request

## License 📝

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments 🙏

- Data sourced from Spotify
- Inspired by the music data science community
- Thanks to all contributors

---
Made with by Gaurav Vipul Kamdar and Loved by Vishesh Kumar ❤️ 
