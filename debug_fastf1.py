"""
Debug script to test FastF1 functionality directly
"""
import fastf1
import os
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def setup_cache():
    # Create cache directory if it doesn't exist
    cache_dir = 'fastf1_cache'
    if not os.path.exists(cache_dir):
        logger.info(f"Creating cache directory: {cache_dir}")
        os.makedirs(cache_dir)
    
    # Enable cache
    logger.info(f"Enabling FastF1 cache at: {cache_dir}")
    fastf1.Cache.enable_cache(cache_dir)

def test_fastf1_basics():
    logger.info(f"FastF1 version: {fastf1.__version__}")
    
    # Get a list of seasons with event schedule
    logger.info("Testing event schedule fetch for 2023")
    try:
        schedule = fastf1.get_event_schedule(2023)
        logger.info(f"Successfully fetched 2023 schedule with {len(schedule)} events")
        
        # Print the first event details
        if len(schedule) > 0:
            first_event = schedule.iloc[0]
            logger.info(f"First event: {first_event['EventName']} in {first_event['Country']}")
    except Exception as e:
        logger.error(f"Error fetching 2023 schedule: {str(e)}")
        
    # Try to load a specific session
    logger.info("Testing session loading for 2023 Bahrain Grand Prix")
    try:
        session = fastf1.get_session(2023, 'Bahrain Grand Prix', 'Race')
        logger.info("Loading session data (this may take a while)...")
        session.load()
        logger.info("Session loaded successfully")
        
        # Get basic results information
        results = session.results
        logger.info(f"Got results with {len(results)} drivers")
        
        # Print the winner details
        if len(results) > 0:
            winner = results.iloc[0]
            logger.info(f"Winner: {winner['Abbreviation']} ({winner['TeamName']})")
    except Exception as e:
        logger.error(f"Error loading session: {str(e)}")

if __name__ == "__main__":
    logger.info("Starting FastF1 debug script")
    setup_cache()
    test_fastf1_basics()
    logger.info("Debug script completed")