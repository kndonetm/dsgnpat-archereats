import { Router } from 'express';
import UserService from '../services/UserService.js';
import multer from 'multer';

const userRouter = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/assets/user_pfp/'),
  filename: (req, file, cb) => cb(null, Date.now() + "_" + file.originalname)
});
const upload = multer({ storage });


userRouter.patch("/user/changePfp", upload.single('media'), async (req, res) => {
  const imgPath = await UserService.changeUserProfilePicture(req.cookies.jwt, req.file);
  
  if (!imgPath) return res.status(400).send("Error updating profile picture.");
  
  res.status(200).send("Profile picture updated.");
});

userRouter.patch("/user/changeDesc", async (req, res) => {
  const userDesc = await UserService.changeUserDescription(req.cookies.jwt, req.body.userDesc);
  
  if (!userDesc) return res.status(400).send("Error updating description.");
  
  res.status(200).send("Description updated.");
});

userRouter.get("/users/:username", async (req, res, next) => {
  try {
      const profile = await UserService.getUserProfile(req.params.username, req.cookies.jwt);
      if (!profile) return next();

      res.render(profile.isOwner ? "theUser" : "user", {
          title: `${profile.username} - Profile`,
          css: '<link href="/static/css/user-profile.css" rel="stylesheet">',
          js: '<script defer src="/static/js/user-profile.js"></script>',
          profilePicture: profile.profilePicture,
          username: profile.username,
          description: profile.description,
          topReviews: profile.topReviews,
          truncatedReviews: profile.truncatedReviews,
      });
  } catch (err) {
      console.log(err);
      res.status(500).send("Internal Server Error");
  }
});

export default userRouter;