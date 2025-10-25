Feature: Slot Booking by Donor
  As a registered donor
  I want to book donation slots at blood banks
  So that I can donate blood at my convenient time

  Background:
    Given I am logged in as a donor user with email "jeevan@gmail.com"
    And I am on the donor dashboard

  @smoke @slots
  Scenario: View available donation slots
    When I navigate to "Book Slot" section
    And I select a blood bank "City Blood Bank"
    And I select a date "2025-11-01"
    Then I should see available time slots for that date
    And each slot should show:
      | information          |
      | Time                 |
      | Availability Status  |
      | Blood Bank Name      |
      | Location             |

  @critical @slots
  Scenario: Book a donation slot
    When I navigate to "Book Slot" section
    And I select blood bank "City Blood Bank"
    And I select date "2025-11-01"
    And I select time slot "10:00 AM - 11:00 AM"
    And I confirm the booking
    Then I should see "Slot booked successfully" message
    And I should receive a booking confirmation with QR code
    And I should get booking reference number
    And the slot should show as "Booked" status

  @slots
  Scenario: View my booked slots
    Given I have booked donation slots
    When I navigate to "My Bookings" section
    Then I should see all my booked slots
    And each booking should display:
      | information      |
      | Blood Bank Name  |
      | Booking Date     |
      | Time Slot        |
      | Status           |
      | QR Code          |
      | Booking ID       |

  @slots
  Scenario: Cancel a booked slot
    Given I have an upcoming booked slot
    When I navigate to "My Bookings" section
    And I click "Cancel Booking" on a future slot
    And I provide cancellation reason "Schedule conflict"
    And I confirm the cancellation
    Then the booking status should change to "Cancelled"
    And the slot should become available for others
    And the blood bank should be notified

  @slots @validation
  Scenario: Prevent booking on past dates
    When I navigate to "Book Slot" section
    And I try to select a past date
    Then the past date should be disabled
    And I should see a message "Cannot book slots for past dates"

  @slots @validation
  Scenario: Check minimum days between donations
    Given I donated blood 30 days ago
    When I try to book a slot within 90 days
    Then I should see a warning message
    And the message should indicate minimum waiting period
    And I should be shown my next eligible donation date

  @slots
  Scenario: Reschedule a booked slot
    Given I have an upcoming booked slot
    When I navigate to "My Bookings" section
    And I click "Reschedule" on a booking
    And I select a new date "2025-11-05"
    And I select a new time slot "2:00 PM - 3:00 PM"
    And I confirm the rescheduling
    Then the booking should be updated with new date and time
    And I should receive updated confirmation
    And the old slot should become available

  @slots @filter
  Scenario: Filter blood banks by location
    When I navigate to "Book Slot" section
    And I enter location "Kochi"
    And I apply location filter
    Then I should see only blood banks in "Kochi"
    And each result should show distance from my location

  @slots @taxi
  Scenario: Book taxi for blood donation appointment
    Given I have booked a donation slot
    When I view my booking details
    And I click "Book Taxi"
    And I select pickup location "Home"
    And I confirm taxi booking
    Then I should see "Taxi booked successfully" message
    And I should receive estimated arrival time
    And taxi details should be added to my booking

  @slots @payment
  Scenario: Make payment for taxi booking
    Given I have booked a taxi for donation
    When the payment page opens
    And I select payment method "Razorpay"
    And I complete the payment
    Then I should see "Payment successful" message
    And I should receive payment receipt
    And the booking status should update to "Confirmed"

  @slots
  Scenario: Download booking confirmation PDF
    Given I have a confirmed booking
    When I navigate to "My Bookings" section
    And I click "Download PDF" on a booking
    Then a PDF document should be generated
    And the PDF should contain:
      | information        |
      | Booking ID         |
      | Donor Name         |
      | Blood Group        |
      | Blood Bank Name    |
      | Date and Time      |
      | QR Code            |
      | Location Address   |

  @slots @notification
  Scenario: Receive reminder for upcoming donation
    Given I have a booking scheduled for tomorrow
    When the reminder time arrives
    Then I should receive a notification
    And the notification should include:
      | information        |
      | Blood Bank Name    |
      | Appointment Time   |
      | Location           |
      | Preparation Tips   |

  @slots
  Scenario: Check slot availability in real-time
    Given the blood bank has limited slots
    When another donor books the last available slot
    And I refresh the slot selection page
    Then the booked slot should not be available
    And I should see "Slot fully booked" status

  @slots
  Scenario Outline: Book slots at different blood banks
    When I select blood bank "<bloodBank>"
    And I select available date
    And I select available time slot
    And I confirm the booking
    Then the booking should be confirmed for "<bloodBank>"

    Examples:
      | bloodBank               |
      | City Blood Bank         |
      | Medical College Blood Bank |
      | General Hospital Blood Bank |
      | Red Cross Blood Bank    |

  @slots @history
  Scenario: View donation history
    Given I have completed multiple donations
    When I navigate to "Donation History" section
    Then I should see all my past donations
    And each record should show:
      | information          |
      | Donation Date        |
      | Blood Bank           |
      | Units Donated        |
      | Blood Group          |
      | Certificate Status   |
      | Next Eligible Date   |

  @slots @certificate
  Scenario: Download donation certificate
    Given I have completed a donation
    When I navigate to "Donation History"
    And I click "Download Certificate"
    Then a donation certificate PDF should be generated
    And the certificate should contain:
      | information      |
      | Donor Name       |
      | Donation Date    |
      | Blood Group      |
      | Units Donated    |
      | Certificate ID   |
      | Blood Bank Seal  |

