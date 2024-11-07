import requests
from bs4 import BeautifulSoup

# Clear the file before starting the crawl
with open(r'C:\Users\pylpf\RPI-dorm-room-helper\src\dorm_details.txt', 'w') as file:
    file.write("")

# Function to crawl the main page and follow dorm links to get detailed information
def crawl_main_page(url):
    base_url = 'https://sll.rpi.edu'  # Set the correct base URL
    try:
        # Send a GET request to the main URL
        response = requests.get(url)
        
        # Check if the request was successful
        if response.status_code == 200:
            print(f"Crawling main page: {url}")
            
            # Parse the main page content
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Find the table containing dorm information
            table = soup.find('table')  # Adjust if needed based on actual HTML structure
            
            if table:
                rows = table.find_all('tr')
                
                for row in rows:
                    # Extract the columns in each row
                    columns = row.find_all('td')
                    
                    # Ensure we have enough columns (e.g., class year and title)
                    if len(columns) >= 2:
                        class_year = columns[0].get_text(strip=True)
                        title = columns[1].get_text(strip=True)
                        dorm_link = columns[1].find('a', href=True)
                        
                        if dorm_link:
                            dorm_url = dorm_link['href']
                            
                            # Correctly construct the full dorm URL
                            if dorm_url.startswith('/'):
                                dorm_url = base_url + dorm_url
                            
                            # Print the dorm URL for verification
                            print(f"\nDorm URL: {dorm_url}")
                            print(f"{class_year.ljust(30)} {title}")
                            
                            # Visit the dorm page to get more details
                            crawl_dorm_page(dorm_url, class_year, title)
                            print("-" * 60)  # Separator for readability
            else:
                print("Dorm table not found on the main page.")
        
    except Exception as e:
        print(f"Failed to crawl main page {url}: {e}")

# Function to crawl each dorm's page for detailed information
def crawl_dorm_page(url, class_year, title):
    try:
        # Send a GET request to the dorm page
        response = requests.get(url)
        
        # Check if the request was successful
        if response.status_code == 200:
            # Parse the dorm page content
            soup = BeautifulSoup(response.text, 'html.parser')
            
            with open(r'C:\Users\pylpf\RPI-dorm-room-helper\src\dorm_details.txt', 'a') as file:
                file.write(f"\nDorm: {title} ({class_year})\n")
                file.write("-" * 60 + "\n")
                
                # Room Types section
                room_types_section = soup.find('div', class_='container room-types')
                if room_types_section:
                    file.write("\nRoom Types:\n")
                    room_table = room_types_section.find('table', class_='table')
                    if room_table:
                        for row in room_table.find_all('tr'):
                            cells = row.find_all('td')
                            if len(cells) == 2:
                                room_type = cells[0].get_text(strip=True)
                                price = cells[1].get_text(strip=True)
                                file.write(f"{room_type.ljust(20)} {price}\n")
                    else:
                        file.write("Room Types table not found.\n")
                
                # Process each section for additional information
                for section, label in [("restrooms", "Restrooms"), 
                                       ("furniture", "Furniture"), 
                                       ("amenities", "Amenities"), 
                                       ("dining", "Dining")]:
                    section_div = soup.find('div', class_=f'container {section}')
                    if section_div:
                        file.write(f"\n{label}:\n")
                        section_table = section_div.find('table', class_='table')
                        if section_table:
                            for row in section_table.find_all('tr'):
                                cells = row.find_all('td')
                                if len(cells) == 2:
                                    item = cells[0].get_text(strip=True)
                                    description = cells[1].get_text(strip=True)

                                    icon_check = cells[1].find('i', class_='fa fa-check')
                                    icon_cross = cells[1].find('i', class_='fa fa-times')

                                    if icon_check:
                                        availability = "has"
                                    elif icon_cross:
                                        availability = "does not have"
                                    else:
                                        availability = "unknown"

                                    # Record both availability and description
                                    if availability == "has":
                                        file.write(f"{item.ljust(30)} {availability}, {description}\n")
                                    elif availability == "does not have":
                                        if description:
                                            file.write(f"{item.ljust(30)} {availability}, {description}\n")
                                        else:
                                            file.write(f"{item.ljust(30)} {availability}\n")
                                    else:
                                        file.write(f"{item.ljust(30)} {description}\n")
                        else:
                            file.write(f"{label} table not found.\n")
                    else:
                        file.write(f"{label} section not found.\n")
                
                file.write("\n" + "=" * 60 + "\n")
        
    except Exception as e:
        print(f"Failed to crawl dorm page {url}: {e}")

# Start crawling from the main page
if __name__ == '__main__':
    start_url = 'https://sll.rpi.edu/housing-comparison'  # Replace with the main dorm list page URL
    crawl_main_page(start_url)
