import { SharedUser } from '@/types';

interface SharedUserAvatarsProps {
  sharedWith: SharedUser[];
  maxAvatars?: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function SharedUserAvatars({ 
  sharedWith, 
  maxAvatars = 3, 
  size = 'md' 
}: SharedUserAvatarsProps) {
  if (!sharedWith || sharedWith.length === 0) {
    return null;
  }

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base'
  };

  const getInitials = (user: SharedUser) => {
    // Try to get initials from fullName first
    if (user.fullName) {
      const nameParts = user.fullName.trim().split(' ');
      if (nameParts.length >= 2) {
        return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
      }
      return user.fullName.charAt(0).toUpperCase();
    }
    
    // Then try username
    if (user.username) {
      return user.username.slice(0, 2).toUpperCase();
    }
    
    // Fallback to email
    if (user.email) {
      const parts = user.email.split('@')[0].split('.');
      if (parts.length >= 2) {
        return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
      }
      return user.email.charAt(0).toUpperCase() + (user.email.charAt(1) || '').toUpperCase();
    }
    
    return '?';
  };

  const visibleUsers = sharedWith.filter(user => user && user.email).slice(0, maxAvatars);
  const totalValidUsers = sharedWith.filter(user => user && user.email).length;
  const remainingCount = totalValidUsers - maxAvatars;

  return (
    <div className="flex items-center -space-x-1">
      {visibleUsers.map((user, index) => {
        if (!user || !user.email) return null;
        
        return (
          <div
            key={user.email}
            className={`${sizeClasses[size]} bg-pink-200 rounded-full flex items-center justify-center text-red-600 font-medium border-2 border-white shadow-sm`}
            style={{ zIndex: maxAvatars - index }}
            title={user.fullName || user.username || user.email}
          >
            {getInitials(user)}
          </div>
        );
      })}
      
      {remainingCount > 0 && (
        <div
          className={`${sizeClasses[size]} bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-medium border-2 border-white shadow-sm`}
          style={{ zIndex: 0 }}
          title={`+${remainingCount} more collaborators`}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
