import requests
from bs4 import BeautifulSoup
import time

# Set of visited URLs to avoid re-crawling the same page
visited_urls = set()

# Function to crawl a given URL
def crawl(url, depth=0, max_depth=2):
    # Stop crawling if we reach maximum depth or the URL has already been visited
    if url in visited_urls or depth > max_depth:
        return
    
    try:
        # Send a GET request to the URL
        response = requests.get(url)
        visited_urls.add(url)  # Add the URL to the set of visited URLs
        
        # Check if the request was successful
        if response.status_code == 200:
            print(f"Crawling: {url} (depth: {depth})")
            
            # Parse the page content with BeautifulSoup
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract and print the page title
            if soup.title:
                print(f"Page Title: {soup.title.string}")
            else:
                print("No title found")
            
            # Extract all the <a> tags with href attributes (i.e., links)
            links = soup.find_all('a', href=True)
            
            # Follow each link and crawl recursively (limit the depth to avoid endless crawling)
            for link in links:
                href = link['href']
                
                # Handle relative URLs by converting them to absolute URLs
                if href.startswith('/'):
                    href = url.rstrip('/') + href
                
                # If the href starts with 'http', follow it
                if href.startswith('http'):
                    crawl(href, depth + 1, max_depth)
        
        # Add a delay between requests to be polite and not overload the server
        time.sleep(1)
    
    except Exception as e:
        print(f"Failed to crawl {url}: {e}")

# Start crawling from a seed URL
if __name__ == '__main__':
    start_url = 'https://sll.rpi.edu/housing-comparison'  # Replace with the website you want to crawl
    crawl(start_url)
