import { Country } from '../types';

export const BUNDLED_COUNTRIES: Country[] = [
  // Europe
  { name: 'France', capital: 'Paris', region: 'Europe', population: 67750000, flagEmoji: '🇫🇷' },
  { name: 'Germany', capital: 'Berlin', region: 'Europe', population: 83200000, flagEmoji: '🇩🇪' },
  { name: 'United Kingdom', capital: 'London', region: 'Europe', population: 67220000, flagEmoji: '🇬🇧' },
  { name: 'Italy', capital: 'Rome', region: 'Europe', population: 60360000, flagEmoji: '🇮🇹' },
  { name: 'Spain', capital: 'Madrid', region: 'Europe', population: 47420000, flagEmoji: '🇪🇸' },
  { name: 'Portugal', capital: 'Lisbon', region: 'Europe', population: 10300000, flagEmoji: '🇵🇹' },
  { name: 'Poland', capital: 'Warsaw', region: 'Europe', population: 37950000, flagEmoji: '🇵🇱' },
  { name: 'Sweden', capital: 'Stockholm', region: 'Europe', population: 10420000, flagEmoji: '🇸🇪' },
  { name: 'Norway', capital: 'Oslo', region: 'Europe', population: 5420000, flagEmoji: '🇳🇴' },
  { name: 'Finland', capital: 'Helsinki', region: 'Europe', population: 5540000, flagEmoji: '🇫🇮' },
  { name: 'Netherlands', capital: 'Amsterdam', region: 'Europe', population: 17590000, flagEmoji: '🇳🇱' },
  { name: 'Belgium', capital: 'Brussels', region: 'Europe', population: 11590000, flagEmoji: '🇧🇪' },
  { name: 'Switzerland', capital: 'Bern', region: 'Europe', population: 8700000, flagEmoji: '🇨🇭' },
  { name: 'Austria', capital: 'Vienna', region: 'Europe', population: 9060000, flagEmoji: '🇦🇹' },
  { name: 'Greece', capital: 'Athens', region: 'Europe', population: 10720000, flagEmoji: '🇬🇷' },
  { name: 'Denmark', capital: 'Copenhagen', region: 'Europe', population: 5870000, flagEmoji: '🇩🇰' },
  { name: 'Czech Republic', capital: 'Prague', region: 'Europe', population: 10900000, flagEmoji: '🇨🇿' },
  { name: 'Hungary', capital: 'Budapest', region: 'Europe', population: 9710000, flagEmoji: '🇭🇺' },
  { name: 'Romania', capital: 'Bucharest', region: 'Europe', population: 19240000, flagEmoji: '🇷🇴' },
  { name: 'Ukraine', capital: 'Kyiv', region: 'Europe', population: 43460000, flagEmoji: '🇺🇦' },

  // Asia
  { name: 'Japan', capital: 'Tokyo', region: 'Asia', population: 125700000, flagEmoji: '🇯🇵' },
  { name: 'China', capital: 'Beijing', region: 'Asia', population: 1411780000, flagEmoji: '🇨🇳' },
  { name: 'India', capital: 'New Delhi', region: 'Asia', population: 1393000000, flagEmoji: '🇮🇳' },
  { name: 'South Korea', capital: 'Seoul', region: 'Asia', population: 51740000, flagEmoji: '🇰🇷' },
  { name: 'Indonesia', capital: 'Jakarta', region: 'Asia', population: 273800000, flagEmoji: '🇮🇩' },
  { name: 'Thailand', capital: 'Bangkok', region: 'Asia', population: 69800000, flagEmoji: '🇹🇭' },
  { name: 'Vietnam', capital: 'Hanoi', region: 'Asia', population: 97340000, flagEmoji: '🇻🇳' },
  { name: 'Philippines', capital: 'Manila', region: 'Asia', population: 110000000, flagEmoji: '🇵🇭' },
  { name: 'Malaysia', capital: 'Kuala Lumpur', region: 'Asia', population: 32730000, flagEmoji: '🇲🇾' },
  { name: 'Singapore', capital: 'Singapore', region: 'Asia', population: 5850000, flagEmoji: '🇸🇬' },
  { name: 'Pakistan', capital: 'Islamabad', region: 'Asia', population: 220900000, flagEmoji: '🇵🇰' },
  { name: 'Bangladesh', capital: 'Dhaka', region: 'Asia', population: 165000000, flagEmoji: '🇧🇩' },
  { name: 'Sri Lanka', capital: 'Colombo', region: 'Asia', population: 21400000, flagEmoji: '🇱🇰' },
  { name: 'Nepal', capital: 'Kathmandu', region: 'Asia', population: 29610000, flagEmoji: '🇳🇵' },

  // Middle East
  { name: 'Saudi Arabia', capital: 'Riyadh', region: 'Middle East', population: 34810000, flagEmoji: '🇸🇦' },
  { name: 'United Arab Emirates', capital: 'Abu Dhabi', region: 'Middle East', population: 9890000, flagEmoji: '🇦🇪' },
  { name: 'Israel', capital: 'Jerusalem', region: 'Middle East', population: 9220000, flagEmoji: '🇮🇱' },
  { name: 'Iran', capital: 'Tehran', region: 'Middle East', population: 84000000, flagEmoji: '🇮🇷' },
  { name: 'Turkey', capital: 'Ankara', region: 'Middle East', population: 84340000, flagEmoji: '🇹🇷' },
  { name: 'Iraq', capital: 'Baghdad', region: 'Middle East', population: 40220000, flagEmoji: '🇮🇶' },
  { name: 'Jordan', capital: 'Amman', region: 'Middle East', population: 10200000, flagEmoji: '🇯🇴' },

  // Africa
  { name: 'Egypt', capital: 'Cairo', region: 'Africa', population: 102300000, flagEmoji: '🇪🇬' },
  { name: 'South Africa', capital: 'Pretoria', region: 'Africa', population: 59310000, flagEmoji: '🇿🇦' },
  { name: 'Nigeria', capital: 'Abuja', region: 'Africa', population: 206100000, flagEmoji: '🇳🇬' },
  { name: 'Kenya', capital: 'Nairobi', region: 'Africa', population: 53770000, flagEmoji: '🇰🇪' },
  { name: 'Morocco', capital: 'Rabat', region: 'Africa', population: 36910000, flagEmoji: '🇲🇦' },
  { name: 'Ethiopia', capital: 'Addis Ababa', region: 'Africa', population: 115000000, flagEmoji: '🇪🇹' },
  { name: 'Ghana', capital: 'Accra', region: 'Africa', population: 31070000, flagEmoji: '🇬🇭' },
  { name: 'Tanzania', capital: 'Dodoma', region: 'Africa', population: 59730000, flagEmoji: '🇹🇿' },
  { name: 'Algeria', capital: 'Algiers', region: 'Africa', population: 44700000, flagEmoji: '🇩🇿' },
  { name: 'Tunisia', capital: 'Tunis', region: 'Africa', population: 11820000, flagEmoji: '🇹🇳' },
  { name: 'Uganda', capital: 'Kampala', region: 'Africa', population: 45740000, flagEmoji: '🇺🇬' },
  { name: 'Cameroon', capital: 'Yaoundé', region: 'Africa', population: 26550000, flagEmoji: '🇨🇲' },
  { name: 'Senegal', capital: 'Dakar', region: 'Africa', population: 16740000, flagEmoji: '🇸🇳' },

  // Americas
  { name: 'United States', capital: 'Washington D.C.', region: 'Americas', population: 331000000, flagEmoji: '🇺🇸' },
  { name: 'Canada', capital: 'Ottawa', region: 'Americas', population: 38010000, flagEmoji: '🇨🇦' },
  { name: 'Mexico', capital: 'Mexico City', region: 'Americas', population: 128900000, flagEmoji: '🇲🇽' },
  { name: 'Brazil', capital: 'Brasília', region: 'Americas', population: 213000000, flagEmoji: '🇧🇷' },
  { name: 'Argentina', capital: 'Buenos Aires', region: 'Americas', population: 45380000, flagEmoji: '🇦🇷' },
  { name: 'Colombia', capital: 'Bogotá', region: 'Americas', population: 50880000, flagEmoji: '🇨🇴' },
  { name: 'Chile', capital: 'Santiago', region: 'Americas', population: 19120000, flagEmoji: '🇨🇱' },
  { name: 'Peru', capital: 'Lima', region: 'Americas', population: 32970000, flagEmoji: '🇵🇪' },
  { name: 'Venezuela', capital: 'Caracas', region: 'Americas', population: 28440000, flagEmoji: '🇻🇪' },
  { name: 'Cuba', capital: 'Havana', region: 'Americas', population: 11330000, flagEmoji: '🇨🇺' },
  { name: 'Ecuador', capital: 'Quito', region: 'Americas', population: 17640000, flagEmoji: '🇪🇨' },
  { name: 'Bolivia', capital: 'Sucre', region: 'Americas', population: 11670000, flagEmoji: '🇧🇴' },

  // Oceania
  { name: 'Australia', capital: 'Canberra', region: 'Oceania', population: 25690000, flagEmoji: '🇦🇺' },
  { name: 'New Zealand', capital: 'Wellington', region: 'Oceania', population: 5120000, flagEmoji: '🇳🇿' },
  { name: 'Papua New Guinea', capital: 'Port Moresby', region: 'Oceania', population: 8950000, flagEmoji: '🇵🇬' },

  // Russia / Central Asia
  { name: 'Russia', capital: 'Moscow', region: 'Europe', population: 143400000, flagEmoji: '🇷🇺' },
  { name: 'Kazakhstan', capital: 'Nur-Sultan', region: 'Asia', population: 18780000, flagEmoji: '🇰🇿' },
  { name: 'Uzbekistan', capital: 'Tashkent', region: 'Asia', population: 34920000, flagEmoji: '🇺🇿' },
];
