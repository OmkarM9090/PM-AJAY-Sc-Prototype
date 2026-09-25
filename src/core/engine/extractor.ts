import { Profile } from '../models/types';

/**
 * Simulates an LLM-based profile extraction engine.
 * In a real application, this would call an LLM with the user's transcript 
 * and return structured JSON.
 */
export async function extractProfileSlots(text: string, currentProfile: Profile): Promise<Partial<Profile>> {
  const t = text.toLowerCase();
  const updates: Partial<Profile> = {};

  // Simple heuristic/keyword based extraction for the demo.
  // In a live system, this is replaced by an LLM parsing the intent and entities.

  // Language Detection
  if (t.includes('marathi')) updates.language = 'mr';
  else if (t.includes('hindi')) updates.language = 'hi';
  else if (t.includes('english')) updates.language = 'en';

  // Education
  if (t.includes('10th') || t.includes('dasvi') || t.includes('daha vi')) updates.education = '10th Pass';
  else if (t.includes('12th') || t.includes('baravi')) updates.education = '12th Pass';
  else if (t.includes('iti')) updates.education = 'ITI';
  else if (t.includes('graduate') || t.includes('bachelor')) updates.education = 'Graduate';
  else if (t.includes('8th') || t.includes('aathvi')) updates.education = '8th Pass';
  else if (t.includes('no formal') || t.includes('uneducated') || t.includes('nahi padha')) updates.education = 'No formal education';

  // Skills & Experience
  const detectedSkills = [];
  if (t.includes('farm') || t.includes('kheti') || t.includes('shet')) detectedSkills.push('Farming');
  if (t.includes('pump') || t.includes('motor')) detectedSkills.push('Pump Repair');
  if (t.includes('weld')) detectedSkills.push('Welding');
  if (t.includes('electric') || t.includes('wiring')) detectedSkills.push('Electrical wiring');
  if (t.includes('plumb') || t.includes('pipe')) detectedSkills.push('Plumbing');
  if (t.includes('tailor') || t.includes('silai')) detectedSkills.push('Tailoring');
  if (t.includes('comput') || t.includes('data entry')) detectedSkills.push('Digital Skills');

  if (detectedSkills.length > 0) {
    updates.skills = Array.from(new Set([...(currentProfile.skills || []), ...detectedSkills]));
  }

  // Employment Preference
  if (t.includes('job') || t.includes('nokri') || t.includes('naukri')) updates.employmentPreference = 'job';
  else if (t.includes('business') || t.includes('swatahcha') || t.includes('khud ka') || t.includes('self')) updates.employmentPreference = 'self-employment';
  else if (t.includes('train') || t.includes('shikna') || t.includes('seekhna')) updates.employmentPreference = 'training';

  // Mobility / Radius
  const radiusMatch = t.match(/(\d+)\s*(km|kilometre|kilometer)/i);
  if (radiusMatch && radiusMatch[1]) {
    updates.radius = parseInt(radiusMatch[1], 10);
    updates.mobility = `${updates.radius} km`;
  }

  // Location / Pincode
  const pinMatch = t.match(/\b\d{6}\b/);
  if (pinMatch) {
    updates.location = {
      ...currentProfile.location,
      locationName: `Pincode ${pinMatch[0]}`,
      lat: 19.2183, // Mock coordinates
      lng: 73.0867,
      pincode: pinMatch[0],
      resolutionSource: 'pincode'
    };
  } else if (t.includes('kalyan')) {
    updates.location = {
      locationName: 'Kalyan', lat: 19.2403, lng: 73.1305, resolutionSource: 'geocoder'
    };
  }

  // Delay to simulate API call
  await new Promise(resolve => setTimeout(resolve, 800));

  return updates;
}
