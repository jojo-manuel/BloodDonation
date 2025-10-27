@donor-search
Feature: Donor Search by MRID - Standalone Test
  As a blood bank user (jeevan@gmail.com)
  I want to search for compatible donors using patient MRID
  So that I can find suitable donors for blood transfusions

  Background:
    Given I am logged in as blood bank with jeevan@gmail.com
    And I navigate to blood bank dashboard

  @smoke @critical
  Scenario: Successfully search for donors with valid MRID
    Given test patient with MRID "402" exists in database
    When I search for donors using patient MRID "402"
    Then I should see donor search results
    And the search results show matching blood group
    And patient information is displayed

  @validation
  Scenario: Search with empty MRID shows validation error
    When I leave MRID field empty and search
    Then I see validation error for empty MRID

  @validation
  Scenario: Search with invalid MRID shows no results
    When I search for donors using patient MRID "INVALID9999"
    Then the page shows no results for invalid MRID

  @ui
  Scenario: Verify MRID search form UI elements
    Then I see MRID search form elements

