// utils/timezones.js
//
// A curated list of common time zones, grouped so a shop owner can find
// their country easily. We use real IANA time zone names (the worldwide
// standard) so this works correctly no matter which computer or server
// actually runs the app.

module.exports = [
  { value: 'Africa/Mogadishu', label: 'Somalia / Kenya / Ethiopia — East Africa (UTC+3)' },
  { value: 'Africa/Cairo', label: 'Egypt — (UTC+2/+3)' },
  { value: 'Africa/Lagos', label: 'Nigeria / West Africa (UTC+1)' },
  { value: 'Africa/Johannesburg', label: 'South Africa (UTC+2)' },
  { value: 'Africa/Casablanca', label: 'Morocco (UTC+1)' },
  { value: 'Asia/Riyadh', label: 'Saudi Arabia (UTC+3)' },
  { value: 'Asia/Dubai', label: 'UAE (UTC+4)' },
  { value: 'Asia/Baghdad', label: 'Iraq (UTC+3)' },
  { value: 'Asia/Istanbul', label: 'Turkey (UTC+3)' },
  { value: 'Asia/Karachi', label: 'Pakistan (UTC+5)' },
  { value: 'Asia/Kolkata', label: 'India (UTC+5:30)' },
  { value: 'Asia/Dhaka', label: 'Bangladesh (UTC+6)' },
  { value: 'Asia/Bangkok', label: 'Thailand (UTC+7)' },
  { value: 'Asia/Jakarta', label: 'Indonesia — Western (UTC+7)' },
  { value: 'Asia/Singapore', label: 'Singapore / Malaysia (UTC+8)' },
  { value: 'Asia/Shanghai', label: 'China (UTC+8)' },
  { value: 'Asia/Tokyo', label: 'Japan (UTC+9)' },
  { value: 'Asia/Seoul', label: 'South Korea (UTC+9)' },
  { value: 'Europe/London', label: 'United Kingdom (UTC+0/+1)' },
  { value: 'Europe/Paris', label: 'France / Germany / Central Europe (UTC+1/+2)' },
  { value: 'Europe/Moscow', label: 'Russia — Moscow (UTC+3)' },
  { value: 'America/New_York', label: 'USA — Eastern (UTC-5/-4)' },
  { value: 'America/Chicago', label: 'USA — Central (UTC-6/-5)' },
  { value: 'America/Denver', label: 'USA — Mountain (UTC-7/-6)' },
  { value: 'America/Los_Angeles', label: 'USA — Pacific (UTC-8/-7)' },
  { value: 'America/Sao_Paulo', label: 'Brazil (UTC-3)' },
  { value: 'America/Mexico_City', label: 'Mexico (UTC-6)' },
  { value: 'Australia/Sydney', label: 'Australia — Eastern (UTC+10/+11)' },
  { value: 'Pacific/Auckland', label: 'New Zealand (UTC+12/+13)' },
  { value: 'UTC', label: 'UTC (world standard time)' },
];
