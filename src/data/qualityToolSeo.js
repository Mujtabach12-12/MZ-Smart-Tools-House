/** Original tool-specific educational help. No claims of AdSense approval or automatic performance gains. */
export const qualityToolSeo = {
  "ratio-calculator": {
    "intro": "Use Simplify ratio when you know both quantities and want the smallest equivalent comparison. Use Solve proportion when one value in two equivalent ratios is missing. Both questions rely on the same proportional relationship, but the inputs and steps are different.",
    "formula": "Simplify integer a:b by dividing both values by their greatest common divisor. In equivalent proportions a:b = c:d, cross multiplication gives a × d = b × c.",
    "example": "Simplify 18:24 by dividing both numbers by 6 to obtain 3:4. To solve 2:3 = 8:x, calculate 2x = 3 × 8, so x = 12.",
    "howTo": [
      "Select Simplify ratio and enter both known amounts, such as 18 and 24, when you only need an equivalent reduced pair.",
      "Select Solve proportion when exactly one value of two equivalent ratios is missing and provide the other three values.",
      "Check the result by cross multiplying both sides; convert measurements to the same unit before comparing them."
    ],
    "features": [
      "Two tasks: reduce a ratio or solve an equivalent proportion",
      "Greatest-common-divisor and cross-multiplication examples",
      "Input-based calculations with explicit mathematical checks"
    ],
    "useCases": [
      "Scale recipe ingredient quantities",
      "Compare equivalent drawing scales",
      "Check school proportion problems"
    ],
    "limitations": "Ratios require compatible measurement units. Convert kilograms to grams or metres to centimetres before comparison. A denominator of zero cannot be used in cross multiplication to solve by division, and decimal results may need rounding.",
    "faq": [
      [
        "How do I simplify 18:24?",
        "The greatest common divisor is 6. Divide 18 and 24 by 6 to obtain the equivalent ratio 3:4."
      ],
      [
        "How do I find x in 2:3 = 8:x?",
        "Cross multiply: 2 × x = 3 × 8, so x = 24 ÷ 2 = 12."
      ]
    ]
  },
  "average-calculator": {
    "intro": "This calculator computes an ordinary arithmetic mean from a list of numbers. It is appropriate when every entry should have equal weight. You can paste values separated by commas, spaces, or lines, making it useful when copying a column of numeric measurements.",
    "formula": "Arithmetic mean = sum of all entered valid numbers ÷ count of entered numbers. A weighted average is a different calculation when observations have unequal importance or credit hours.",
    "example": "For 10, 20, 30 and 40, the sum is 100, the count is 4 and the arithmetic mean is 25. Replacing 40 with 400 raises the mean to 115, showing the effect of an outlier.",
    "howTo": [
      "Enter a list of numbers in the Numbers field, using commas, spaces or line breaks as separators.",
      "Review the input for headings, text units or missing values because nonnumeric tokens should not be silently treated as numbers.",
      "Calculate the arithmetic mean and inspect summary values where the tool shows them; choose a weighted-mean method separately if entries have different weights."
    ],
    "features": [
      "Comma, space or newline separated input",
      "Arithmetic mean from the actual number list",
      "Invalid-token guidance to avoid misleading results"
    ],
    "useCases": [
      "Average evenly weighted quiz scores",
      "Check a spreadsheet column of numbers",
      "Summarize daily measurement values"
    ],
    "limitations": "A simple mean gives all entered values equal weight, even if some represent larger samples. Empty input has no defined average. Extreme outliers can distort the mean, so the median may better describe skewed data.",
    "faq": [
      [
        "What is the average of 10, 20, 30 and 40?",
        "Add the numbers to get 100 and divide by four. The arithmetic mean is 25."
      ],
      [
        "Is the mean the same as a median?",
        "No. The mean uses sum divided by count; the median is the middle sorted value or average of two middle values."
      ]
    ]
  },
  "percentage-calculator": {
    "intro": "The word percent means out of one hundred, but not all percentage questions are alike. Finding 15% of 200, finding what percent a part represents, and measuring the change between old and new values use different denominators. Identify the question before entering values.",
    "formula": "Percentage amount = percent ÷ 100 × base. Part as percent = part ÷ whole × 100 when whole is nonzero. Relative change = (new − old) ÷ old × 100 when old is nonzero.",
    "example": "15% of 200 equals 30. A price rising from 200 to 230 increases by 15%; returning from 230 to 200 decreases by approximately 13.04% because the starting base changes.",
    "howTo": [
      "Choose the percentage question that matches your task: percent of an amount, part of a whole or change between values.",
      "Enter the percentage and base amount, or old and new values, with the correct direction and units.",
      "Check which value is used as the denominator and distinguish a percent change from a percentage-point change."
    ],
    "features": [
      "Percent-of-number and change concepts",
      "Clear denominator and starting-base explanations",
      "Worked financial and classroom examples"
    ],
    "useCases": [
      "Understand exam marks percentages",
      "Calculate a sale discount amount",
      "Compare budget or price changes"
    ],
    "limitations": "A zero original value makes the usual relative percentage change undefined. A rise from 20% to 30% is 10 percentage points, not a 10% relative increase; the latter is 50% in that example.",
    "faq": [
      [
        "What is 15% of 200?",
        "Multiply 200 by 0.15 to obtain 30."
      ],
      [
        "Why do a 15% rise and a 15% fall not cancel?",
        "The fall is calculated using the new, larger amount. The base of the second percentage is different."
      ]
    ]
  },
  "age-calculator": {
    "intro": "Calendar age uses completed years, then remaining months and days, rather than a rough total-day count divided by 365. Month lengths and leap years matter especially near birthdays and 29 February. Check the date used for the comparison.",
    "formula": "Calendar age is expressed in completed years plus remaining completed calendar months and days between the birth date and comparison date.",
    "example": "A person born on 1 January 2000 turns 26 on 1 January 2026. On 1 March 2026, that person is 26 years and 2 calendar months old.",
    "howTo": [
      "Select the correct birth date using the calendar input, checking day, month and year order.",
      "Review the reference date used by the calculator and calculate the difference in completed calendar components.",
      "Double-check birthdays, leap days and any eligibility cutoff date specified by an institution."
    ],
    "features": [
      "Birth-date based calendar calculation",
      "Completed year, month and day interpretation",
      "Leap-year and birthday boundary guidance"
    ],
    "useCases": [
      "Check an age for an application form",
      "Plan birthdays and anniversaries",
      "Understand calendar age differences"
    ],
    "limitations": "Elapsed days divided by 365 is not exact calendar age. Official legal age thresholds and cutoff dates can vary by institution or jurisdiction, so verify the relevant rule. Avoid sharing personal birth dates without a reason.",
    "faq": [
      [
        "Why is age not total days divided by 365?",
        "Years can contain 366 days and calendar months have unequal lengths, so a calendar birthday calculation is more precise."
      ],
      [
        "What if someone was born on 29 February?",
        "Leap-day birthdays require careful calendar treatment in non-leap years; official eligibility rules may define a different observed date."
      ]
    ]
  },
  "discount-calculator": {
    "intro": "A discount normally reduces an original price by a stated percentage. It is useful to separate the amount you save from the final price you pay. If several discounts are applied in sequence, each successive discount is calculated on the already reduced price.",
    "formula": "Discount amount = original price × discount rate ÷ 100. Price after discount = original price − discount amount.",
    "example": "A 20% discount on a 1,500 price saves 300 and leaves a sale price of 1,200. Two consecutive 10% discounts on 1,000 produce 900 then 810, not 800.",
    "howTo": [
      "Enter the original price before any discount is applied.",
      "Enter the discount percentage, such as 20 for twenty percent, and calculate the savings and final price.",
      "Review the currency, sales tax and shipping rules separately because they may not be included in the displayed calculation."
    ],
    "features": [
      "Calculates money saved and discounted price",
      "Clear base-price formula",
      "Worked single and consecutive discount examples"
    ],
    "useCases": [
      "Compare retail sale offers",
      "Estimate a price after promotion",
      "Check an advertised percentage saving"
    ],
    "limitations": "This basic formula does not automatically include taxes, delivery fees, coupons or multiple promotions. Successive discounts are not added directly: apply each percentage to the price remaining after the previous discount.",
    "faq": [
      [
        "How much is 20% off 1,500?",
        "The discount is 300, so the price after the discount is 1,200 before any extra fees or taxes."
      ],
      [
        "Do two 10% discounts equal 20% off?",
        "No. Applying them successively to 1,000 leaves 810, which is 19% below the original amount."
      ]
    ]
  },
  "image-resizer": {
    "intro": "Resizing changes an image's pixel width and height; it does not necessarily crop the picture or guarantee a smaller file. Choose the target size for your intended use and preserve the original width-to-height ratio when you want to avoid stretching.",
    "formula": "Aspect ratio = width ÷ height. To keep the same ratio, new height = original height × new width ÷ original width.",
    "example": "A 2400 × 1600 pixel photo has a 3:2 aspect ratio. At 1200 pixels wide, proportional resizing gives 800 pixels high. Making it 1200 × 1600 instead changes its shape.",
    "howTo": [
      "Choose an image from your device and note the original pixel dimensions.",
      "Choose the required output width and height while keeping them proportional unless stretching is intentional.",
      "Review the image where a preview is available and save the resized result; keep your original file."
    ],
    "features": [
      "Custom pixel-dimension resizing",
      "Aspect-ratio calculation guidance",
      "Image-quality and output-size trade-off explanations"
    ],
    "useCases": [
      "Prepare web thumbnails",
      "Resize a profile or product photograph",
      "Scale high-resolution screenshots"
    ],
    "limitations": "Upscaling cannot recreate details absent from a small source image. Resizing is different from cropping. The output file size also depends on image format and compression quality; fewer pixels do not guarantee a specific file-size reduction.",
    "faq": [
      [
        "How do I halve 2400 × 1600 pixels?",
        "Divide both dimensions by two. The result is 1200 × 800 pixels and keeps the original 3:2 aspect ratio."
      ],
      [
        "Is resizing the same as image compression?",
        "No. Resizing changes pixel dimensions; compression changes how image data is stored. Both may affect file size."
      ]
    ]
  },
  "time-calculator": {
    "intro": "This tool separates duration arithmetic from clock-time differences. An elapsed duration can be more than 24 hours, whereas time shown on a clock normally wraps at midnight. Select the correct mode before you enter hours, minutes and seconds.",
    "formula": "Convert each duration to total seconds using 3600 × hours + 60 × minutes + seconds, add or subtract, then convert the result back to hours, minutes and seconds.",
    "example": "1 hour 30 minutes plus 2 hours 45 minutes is 4 hours 15 minutes. An interval from 22:00 to 02:00 the following morning is four hours when there is no daylight-saving change.",
    "howTo": [
      "Choose duration addition/subtraction for elapsed times, or clock-time difference for time-of-day readings.",
      "Enter hours, minutes and seconds in the appropriate fields and select add or subtract when using duration mode.",
      "Check whether the answer should be an elapsed duration greater than 24 hours or an overnight clock interval."
    ],
    "features": [
      "Duration addition and subtraction",
      "Clock-time difference interpretation",
      "Practical examples across midnight"
    ],
    "useCases": [
      "Add study or work sessions",
      "Calculate travel-time durations",
      "Check overnight schedule intervals"
    ],
    "limitations": "Clock time without a date and time zone cannot represent daylight-saving transitions precisely. Minutes and seconds fields commonly use values from 0 to 59; a duration of 90 minutes should be entered as 1 hour 30 minutes.",
    "faq": [
      [
        "Why is 20 hours plus 8 hours equal to 28?",
        "Duration arithmetic measures total elapsed time and does not reset at 24 hours."
      ],
      [
        "How much time passes from 22:00 to 02:00 next day?",
        "Four hours pass if it is the following day and no time-zone or daylight-saving adjustment intervenes."
      ]
    ]
  },
  "speaking-time-calculator": {
    "intro": "Paste the words you plan to speak rather than an estimated word count. This tool uses a fixed planning speed of 130 words per minute and rounds the estimated duration upward to whole minutes. It is a useful rough guide, not a substitute for rehearsal.",
    "formula": "Estimated minutes = max(1, ceil(word count ÷ 130)). A nonempty partial minute is rounded upward, and the interface uses a one-minute minimum.",
    "example": "At 130 words per minute, a 260-word script is estimated at two minutes and a 390-word script at three minutes. In both cases, real pauses may make delivery longer.",
    "howTo": [
      "Paste the actual spoken script, excluding headings and notes you do not intend to say aloud.",
      "Review the estimated speaking duration at the tool's fixed 130-WPM planning pace.",
      "Rehearse aloud and add time for pauses, questions, emphasis and slide changes before finalizing your schedule."
    ],
    "features": [
      "Text-driven word count",
      "Transparent fixed 130-WPM estimate",
      "Speech and presentation planning examples"
    ],
    "useCases": [
      "Prepare short classroom speeches",
      "Estimate presentation narration duration",
      "Compare the length of two script drafts"
    ],
    "limitations": "This version does not measure your personal speaking speed. Delivery speed varies with language, pauses and presentation style. Rounding to full minutes and the one-minute minimum make short speeches appear longer than a literal fraction of a minute.",
    "faq": [
      [
        "How long does a 260-word speech take at 130 WPM?",
        "The formula gives 260 divided by 130, which is exactly two minutes before adding pauses."
      ],
      [
        "Does this include slide changes or audience questions?",
        "No. The estimate uses only words and a fixed rate; add the extra time from your own rehearsals."
      ]
    ]
  }
};
