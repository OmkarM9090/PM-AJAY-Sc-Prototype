import { Profile, Opportunity, Recommendation, SkillGap } from '../models/types';
import { calculateDistance } from './geo';

export class RecommendationEngine {
  
  public static generateRecommendations(
    profile: Profile, 
    opportunities: Opportunity[]
  ): Recommendation[] {
    if (!profile.location || !profile.radius) return [];

    const recommendations: Recommendation[] = [];

    for (const opp of opportunities) {
      // Geo filter
      const distance = calculateDistance(
        profile.location.lat, profile.location.lng, 
        opp.lat, opp.lng
      );

      if (distance > (profile.radius || 50)) continue; // Apply hard constraint if exists

      // Calculate Goal Fit
      let goalFit = 0.5;
      if (profile.employmentPreference) {
         if (profile.employmentPreference === opp.type) {
            goalFit = 1.0;
         } else if (opp.type === 'training') {
            // Training is always somewhat relevant
            goalFit = 0.7;
         }
      }

      // Calculate Skill Fit
      let skillFit = 0;
      let matchedSkills = 0;
      let needToLearn = opp.requiredSkills.filter(reqSkill => {
         const hasSkill = profile.skills.some(userSkill => 
            userSkill.toLowerCase().includes(reqSkill.toLowerCase()) || 
            reqSkill.toLowerCase().includes(userSkill.toLowerCase())
         );
         if (hasSkill) matchedSkills++;
         return !hasSkill;
      });

      if (opp.requiredSkills.length > 0) {
         skillFit = matchedSkills / opp.requiredSkills.length;
      } else {
         skillFit = 1.0; // If no specific skills required, fit is high
      }

      // Generate Skill Gap
      const skillGap: SkillGap = {
        targetOccupation: opp.title,
        alreadyKnow: opp.requiredSkills.filter(s => !needToLearn.includes(s)),
        needToLearn: needToLearn,
        canImprove: opp.preferredSkills || []
      };

      // Why this match explanation
      const reasons = [];
      if (skillFit > 0.5) reasons.push("Matches your existing skills well.");
      if (goalFit === 1.0) reasons.push(`Matches your preference for ${opp.type}.`);
      reasons.push(`Located within your travel limit (${Math.round(distance)} km away).`);

      let nextStep = "Apply for this opportunity.";
      if (needToLearn.length > 0) {
        nextStep = "Consider a short training to bridge the skill gap.";
      } else if (opp.type === 'self-employment') {
        nextStep = "Review the financial support information to start.";
      }

      const totalScore = (skillFit * 0.4) + (goalFit * 0.4) + (Math.max(0, 1 - (distance/50)) * 0.2);

      recommendations.push({
        opportunity: opp,
        distance,
        scoreComponents: {
          skillFit,
          goalFit,
          distanceFit: Math.max(0, 1 - (distance/50)),
          total: totalScore
        },
        whyThisMatch: {
          reasons,
          alreadyKnow: skillGap.alreadyKnow,
          mayNeed: skillGap.needToLearn,
          nextStep
        },
        skillGap
      });
    }

    // Sort by total score descending
    return recommendations.sort((a, b) => b.scoreComponents.total - a.scoreComponents.total);
  }
}
