Feature: Blood Bank Donor Management
  As a blood bank user
  I want to search and manage donors
  So that I can add donors to my system and track their information

  Background:
    Given I am logged in as a blood bank user
    And I am on the blood bank dashboard
    And I navigate to the donors tab

  @bloodbank @donor @critical
  Scenario: Blood bank searches for donors by blood group
    When I search for donors with blood group "O+"
    Then I should see a list of donors with blood group "O+"
    And each donor should display their name and contact information

  @bloodbank @donor @critical
  Scenario: Blood bank searches for donors by email
    When I search for donors with email "donor@example.com"
    Then I should see donor information for "donor@example.com"
    And the donor details should include name, blood group, and contact information

  @bloodbank @donor @critical
  Scenario: Blood bank searches for donors by location
    When I search for donors in location "Kochi"
    Then I should see donors located in "Kochi"
    And each donor should display their address information

  @bloodbank @donor
  Scenario: Blood bank views all donors
    When I click on "All Donors" view
    Then I should see a list of all available donors
    And each donor should display their basic information

  @bloodbank @donor
  Scenario: Blood bank views donor visit history
    When I click on "Visit History" view
    Then I should see a list of donors who have visited
    And each entry should show visit date and donation details

  @bloodbank @donor
  Scenario: Blood bank searches for donors with multiple criteria
    When I search for donors with:
      | Blood Group | O+      |
      | Location    | Kochi   |
    Then I should see donors matching both criteria
    And each donor should have blood group "O+" and be located in "Kochi"

  @bloodbank @donor
  Scenario: Blood bank clears donor search filters
    Given I have searched for donors with blood group "A+"
    When I clear the search filters
    Then I should see all donors again
    And the search fields should be empty

  @bloodbank @donor
  Scenario: Blood bank views donor details
    Given I have searched for a donor
    When I click on a donor from the list
    Then I should see detailed donor information including:
      | Field              |
      | Name               |
      | Blood Group        |
      | Contact Number     |
      | Email              |
      | Address            |
      | Availability Status |

  @bloodbank @donor @negative
  Scenario: Blood bank searches for non-existent donor
    When I search for donors with email "nonexistent@example.com"
    Then I should see a message indicating no donors found
    Or I should see an empty donor list

