// import { getStorage, ref, uploadBytes, initializeApp } from "firebase";

// export function gcsToHttps(gcsPath: string) {
export function normalizeGCSPath(gcsPath: string) {
  if (!gcsPath) return gcsPath;
  if (gcsPath.startsWith("http")) return gcsPath;
  if (!gcsPath.startsWith("gs://")) return gcsPath;
  const noScheme = gcsPath.slice("gs://".length);
  const slash = noScheme.indexOf("/");
  const bucket = noScheme.slice(0, slash);
  const object = noScheme.slice(slash + 1);
  // public domain that works in <img>
  return `https://storage.googleapis.com/${bucket}/${object}`;
}

// export function normalizeGCSPath(gcsPath: string): string {
//   return gcsPath.replace(
//     /^gs:\\/\\/(.+?)\\/(.+)$/,
//     'https://storage.googleapis.com/$1/$2'
//   );
// }

// TODO: Replace the following with your app's Firebase project configuration
// See: https://firebase.google.com/docs/web/learn-more#config-object
// const firebaseConfig = {
//   // ...
//   storageBucket: 'BUCKET_NAME'
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);

// export function uploadImageFile(file: File, location: string) {
//   // Create a root reference
//   const storage = getStorage();
//   // Create a reference to the specified location
//   const bucketRef = ref(storage, location);
//   // 'file' comes from the Blob or File API
//   // The location should be in the format: 'finteck-hackathon/your-object-key'
//   uploadBytes(bucketRef, file).then((snapshot: any) => {
//     console.log('Uploaded a blob or file!');
//   });
// }