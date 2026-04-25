Create a project and solution that will use python 3.11 to 3.14. Use Posgres as the spatial SQL database, and sqllite for the user and context database.

The overall goal is to create a website that uses flask as the framework. 
With Flask create the following pages:
1 - A simple user homepage interface that lets a user enter and/or create credentials, and allow a user to recover if they forgot thier password. This will include the following:
email address, First Name, Last Name, password.

The rest of pages below apply to only authenticated users, the rest get a 400 error code.

2 - Search Criteria page, this will let a user enter the following:
Root zip code address (five digits only). Range specified in Miles. House sale value in USD (allow to enter minumum and maxiumum). Bathroom count, berdroom count, HOA (Checkbox for yes or no), square footage size under AC (minumum and maxiumum), square footage size lot (minumum and maxiumum).

3 - Results page, using open maps, show allow homes that match the criteria on the map. Allow user to select mutiple homes to save and compare later.

For backend on how data is stored: Store the username/email/name/password/zip code/ranges and other options in sqllite.

For the backend, create seperate docker images and configurations for the following:
Postgress SQL that is able to run spatial queries.
SQLlit to store info
sqllite for non-spatial data.

Create seperate docker files, and docker images running on latest and stable Debian images. Enforce normal security measures for the docker images with least amount of privilages possible. Create the service passwords to be the same for all docker images and services, the password shall be Password123Password.

The goal of this application is to allow a user to create an account with the services. The service will take a general zip code, a mile range distance that includes the specific area code, and all other area codes that can be reached within the specified mile range.

Using Spatial SQL find homes that match the critia in range.

When a user selects a house, generate a list that will show the following:

Distance to closests schools, day cares, gas stations, and large grocery stores.

