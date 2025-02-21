export type Tier = 'novice' | 'amateur' | 'pro' | 'expert' | 'grandmaster' | 'open';


export function getTierFromRating(rating: number): Tier {
    if (rating < 200) return 'novice';
    if (rating < 500) return 'amateur';
    if (rating < 800) return 'pro';
    if (rating < 1200) return 'expert';
    return 'grandmaster';
  }