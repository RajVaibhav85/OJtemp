const Profile = require('../Models/Profile');

const updateProfile = async (req, res, next) => {
    try {
        const { bio, github, linkedin, website, languages, frameworks } = req.body;
        // Fallback selector ensures we parse the token identification parameters regardless of middleware format
        const userId = req.user?.id || req.user?._id; 

        if (!userId) {
            return res.status(401).json({ success: false, message: "User context unverified." });
        }

        const updatedProfile = await Profile.findOneAndUpdate(
            { user: userId },
            {
                $set: {
                    bio: bio || "",
                    'socials.github': github || "",
                    'socials.linkedin': linkedin || "",
                    'socials.website': website || "",
                    'skills.languages': Array.isArray(languages) ? languages : (languages ? languages.split(',').map(s => s.trim()) : []),
                    'skills.frameworks': Array.isArray(frameworks) ? frameworks : (frameworks ? frameworks.split(',').map(s => s.trim()) : [])
                }
            },
            { 
                returnDocument: 'after',
                upsert: true,
                setDefaultsOnInsert: true,
                runValidators: true 
            }
        ).populate('user', 'username email dob role');

        res.status(200).json({ success: true, data: updatedProfile });
    } catch (error) {
        next(error);
    }
};

const getProfile = async (req, res, next) => {
    try {
        const userId = req.user?.id || req.user?._id;

        if (!userId) {
            return res.status(401).json({ success: false, message: "User context payload unreachable." });
        }

        const userProfile = await Profile.findOneAndUpdate(
            { user: userId },
            { $setOnInsert: { user: userId } },
            { 
                returnDocument: 'after', 
                upsert: true, 
                setDefaultsOnInsert: true 
            }
        ).populate('user', 'username email dob role');
        
        res.status(200).json(userProfile);
    } catch (error) {
        next(error);
    }
};

module.exports = { updateProfile, getProfile };