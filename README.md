# PyPSA-Earth Dashboard.

## Project Description

The PyPSA-Earth Dashboard offers an interactive mapping and data visualization platform for energy systems analysis. This tool implements technologies such as OpenLayers, Django, and PostGIS to visualize the network architecture, optimized installed capacity and Scenario Analysis.

## Features

- **Interactive Mapping:** Explore detailed visualizations of Nigeria, Colombia and USA electrical grid and geographic features through an OpenLayers interface.
- **Scenario Analysis:** Compare 2021 vs 2050 scenarios in the USA by synchronizing maps and charts to visualize energy transitions across different carriers and variables.
- **Data Visualization:** Utilize Chart.js to view and interact with energy data through dynamic charts and graphs.
- **Real-Time Search:** Find specific country locations or infrastructure components within the interactive map.
- **Customizable Data Layers:** Toggle various data layers to focus on different aspects of energy infrastructure, such as Network Statistics or existing grid structures.

## Installation

### Prerequisites

To run this project, ensure you have the following installed:
- [Conda](<https://docs.conda.io/projects/conda/en/latest/user-guide/install/index.html>) for managing the environment.
- [Redis](<https://redis.io/download>) for caching management.

### Environment Setup

1. **Fork and clone the Repository [link](https://github.com/BryanFran/PyPSAEarthDashboard):**
   ```bash
   # e.g., git clone https://github.com/BryanFran/PyPSAEarthDashboard
   cd PyPSAEarthDashboard

2. **Create and Activate the Conda Environment:**
    
    ```bash
    conda env create -f environment.yml
    conda activate dashboard_env
    
    ```
    
3. **Start Redis Server:**
Make sure your Redis server is running, as it handles caching and session management:
    
    ```bash
    redis-server
    ```
    
4. **Database Setup:**
Adjust the `.env` file with your database and Redis connection settings.
    
    ```bash
    python manage.py migrate
    # A database backup is provided in the form of an SQL file named `PyPSAEarthDashboard.sql`. This file can be used to easily restore the database using pgAdmin, a popular database management tool for PostgreSQL.

    ```
    

## Usage

To use the dashboard:

1. **Start the Django Server:**
    
    ```bash
    python manage.py runserver
    ```
    
    This command starts a local web server. To access the dashboard, navigate to `http://localhost:8000` in your web browser.
    
2. **Explore the Dashboard:**
    - Utilize the layer controls in the sidebar to toggle different data layers.
    - Use the search bar to navigate to specific locations quickly.
    - View various statistics through charts and graphs.

## Contributing

Would you be interested in contributing? Great! You can contribute by forking the repository, making changes, and submitting a pull request. You can also report bugs or suggest new features by opening issues.

## Credits

This project was financed by the program ["Junge Innovatoren (JI)"](https://www.junge-innovatoren.de/) of the Federal State of Baden-Württemberg and developed in collaboration with the Karlsruhe Institute of Technology (KIT) [Karlsruhe Institute of Technology (KIT)](https://kit.edu/), [Open Energy Transition (OET)](https://openenergytransition.org/), and [Stuttgart University of Applied Sciences](https://www.hft-stuttgart.com/).

<p align="center">
  <a href="https://www.junge-innovatoren.de/" target="_blank">
    <img src="https://github.com/open-energy-transition/energy-gis-dashboard/assets/42655811/3bbe4241-4f39-47bb-bf9b-72e7076cf5a8" alt="junge-innovatoren_4c" height="100">
  </a>
  <a href="https://www.baden-wuerttemberg.de/de/startseite/" target="_blank">
    <img src="https://github.com/open-energy-transition/energy-gis-dashboard/assets/42655811/6f70ed80-eaf3-4e5e-b8ed-71b4b90bc8ad" alt="bw100_gr_4c_mwk" height="100">
  </a>
   <a href="https://www.kit.edu/" target="_blank">
      <img src="https://github.com/open-energy-transition/energy-gis-dashboard/assets/42655811/07e651ad-14fd-4611-b56a-a724346a1323" alt="kit-logo-color" height="100">
      </a>
   <a href="https://openenergytransition.org/" target="_blank">
      <img src="https://github.com/open-energy-transition/energy-gis-dashboard/assets/42655811/c771930a-36ff-40c8-aff1-f99634cffa12" alt="oet-logo-red-n-subtitle" height="100">
      </a>
</p>

## License

This project is open-source under the [GNU Affero General Public License v3.0](https://www.gnu.org/licenses/agpl-3.0.html). The LICENSE folder in this repository provides more details.

[![REUSE status](https://api.reuse.software/badge/github.com/pypsa-meets-earth/pypsa-earth)](https://api.reuse.software/info/github.com/pypsa-meets-earth/pypsa-earth)
## Contact

Please get in touch with [Bryan Ramirez](https://github.com/BryanFran) and [Ekaterina Fedotova](https://github.com/ekatef) for further information or support.
