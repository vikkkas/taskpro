const roleMiddleware = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No user found.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires one of the following roles: ${roles.join(', ')}`
      });
    }

    next();
  };
};

// Common role combinations
const adminOnly = roleMiddleware('admin');
const teamMemberOnly = roleMiddleware('team-member');
const allUsers = roleMiddleware('admin', 'team-member');

module.exports = {
  roleMiddleware,
  adminOnly,
  teamMemberOnly,
  allUsers
};
