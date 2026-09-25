import math
import json
import os

def haversine(lat1, lon1, lat2, lon2):
    R = 6371  # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) * math.sin(dlat / 2) +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) * math.sin(dlon / 2))
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def calculate_skill_gap(user_skills, required_skills):
    already_know = [s for s in user_skills if s in required_skills]
    need_to_learn = [s for s in required_skills if s not in user_skills]
    return {
        "alreadyKnow": already_know,
        "needToLearn": need_to_learn
    }

def get_opportunities():
    # Load from the seed data
    data_path = os.path.join(os.path.dirname(__file__), '../../src/data/seed/opportunities.json')
    try:
        with open(data_path, 'r') as f:
            return json.load(f)
    except Exception:
        return []

def generate_recommendations(profile):
    opps = get_opportunities()
    recs = []
    
    user_lat = profile.lat or 19.2183
    user_lng = profile.lng or 73.0867
    user_radius = profile.radius or 50
    user_skills = profile.skills or []

    for opp in opps:
        dist = haversine(user_lat, user_lng, opp['lat'], opp['lng'])
        if dist > user_radius:
            continue
            
        skill_gap = calculate_skill_gap(user_skills, opp.get('requiredSkills', []))
        
        # Scoring
        skill_fit = len(skill_gap['alreadyKnow']) / max(1, len(opp.get('requiredSkills', [])))
        goal_fit = 1.0 if profile.employment_preference == opp['type'] else 0.3
        dist_fit = max(0, 1 - (dist / user_radius))
        
        total_score = (skill_fit * 0.4) + (goal_fit * 0.4) + (dist_fit * 0.2)
        
        reasons = []
        if goal_fit == 1.0:
            reasons.append(f"Fits your {profile.employment_preference} goal")
        if dist <= 5:
            reasons.append(f"Very close to your location ({round(dist, 1)} km)")
        if len(skill_gap['alreadyKnow']) > 0:
            reasons.append("Matches your existing skills")
            
        next_step = "Contact provider" if len(skill_gap['needToLearn']) == 0 else "Complete skill gap training"
        
        recs.append({
            "opportunity": opp,
            "scoreComponents": {
                "skillFit": skill_fit,
                "goalFit": goal_fit,
                "distanceFit": dist_fit,
                "total": total_score
            },
            "distance": dist,
            "skillGap": skill_gap,
            "whyThisMatch": {
                "reasons": reasons,
                "nextStep": next_step
            }
        })
        
    recs.sort(key=lambda x: x['scoreComponents']['total'], reverse=True)
    return recs
