import React, { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Phone, Image, LogOut, Edit2, Save, X } from 'lucide-react';

const ProfileModal = ({ open, onOpenChange, onLogout }) => {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);
  
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    description: user?.description || '',
    image: user?.image || ''
  });

  const [imagePreview, setImagePreview] = useState(user?.image || null);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Limit file size to 2MB
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please select an image smaller than 2MB',
          variant: 'destructive'
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        // Compress image by resizing
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimensions
          const maxWidth = 400;
          const maxHeight = 400;
          
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round(height * (maxWidth / width));
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round(width * (maxHeight / height));
              height = maxHeight;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);
          
          // Convert to compressed JPEG
          const compressedImage = canvas.toDataURL('image/jpeg', 0.7);
          setImagePreview(compressedImage);
          setEditForm({ ...editForm, image: compressedImage });
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!editForm.name) {
      toast({
        title: 'Error',
        description: 'Name is required',
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile(
        editForm.name,
        editForm.phone,
        editForm.description,
        editForm.image
      );
      toast({
        title: 'Success!',
        description: 'Profile updated successfully',
        variant: 'default'
      });
      setIsEditing(false);
    } catch (err) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditForm({
      name: user?.name || '',
      phone: user?.phone || '',
      description: user?.description || '',
      image: user?.image || ''
    });
    setImagePreview(user?.image || null);
    setIsEditing(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md backdrop-blur-xl bg-white/10 dark:bg-black/30 border border-white/20 dark:border-white/10 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {isEditing ? 'Edit Profile' : 'My Profile'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
          {/* Profile Picture */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-1 shadow-lg">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt={user?.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-white/20 flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>
                )}
              </div>
              {isEditing && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-gradient-to-r from-cyan-500 to-blue-500 p-2 rounded-full hover:shadow-lg transition-all"
                >
                  <Image className="w-4 h-4 text-white" />
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* Display Mode */}
          {!isEditing ? (
            <div className="space-y-3 text-center">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                <p className="font-semibold text-lg text-gray-900 dark:text-white">{user?.name}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
                  <Mail className="w-4 h-4" /> Email
                </p>
                <p className="font-medium text-gray-700 dark:text-gray-200 break-all text-sm">{user?.email}</p>
              </div>

              {user?.phone && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
                    <Phone className="w-4 h-4" /> Phone
                  </p>
                  <p className="font-medium text-gray-700 dark:text-gray-200">{user?.phone}</p>
                </div>
              )}

              {user?.description && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Bio</p>
                  <p className="text-gray-700 dark:text-gray-200 text-sm italic">{user?.description}</p>
                </div>
              )}
            </div>
          ) : (
            // Edit Mode
            <div className="space-y-3">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Full Name
                </label>
                <Input
                  placeholder="Your Name"
                  className="bg-white/5 border-white/20 focus:border-purple-400 focus:bg-white/10 transition-all"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Phone Number
                </label>
                <Input
                  placeholder="+1 (555) 000-0000"
                  className="bg-white/5 border-white/20 focus:border-purple-400 focus:bg-white/10 transition-all"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Bio / Description
                </label>
                <textarea
                  placeholder="Tell us about yourself..."
                  className="w-full h-20 px-3 py-2 rounded-md bg-white/5 border border-white/20 focus:border-purple-400 focus:bg-white/10 transition-all text-gray-900 dark:text-white placeholder:text-gray-500 resize-none"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 pt-4 border-t border-white/10">
          {!isEditing ? (
            <>
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                className="flex-1 bg-white/5 border-white/20 hover:bg-white/10"
              >
                <Edit2 className="w-4 h-4 mr-2" /> Edit Profile
              </Button>
              <Button
                onClick={onLogout}
                variant="destructive"
                className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-600 dark:text-red-400 border-red-500/30"
              >
                <LogOut className="w-4 h-4 mr-2" /> Logout
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleCancel}
                variant="outline"
                className="flex-1 bg-white/5 border-white/20 hover:bg-white/10"
              >
                <X className="w-4 h-4 mr-2" /> Cancel
              </Button>
              <Button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-lg hover:shadow-purple-500/50"
              >
                <Save className="w-4 h-4 mr-2" /> {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileModal;
