import React, { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Mail, Lock, User, Phone, Image, Zap, Eye, EyeOff } from 'lucide-react';

const LoginPage = ({ onSuccess }) => {
  const { register, login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const fileInputRef = useRef(null);

  // Register form state
  const [registerForm, setRegisterForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    description: ''
  });

  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

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

      setSelectedImage(file);
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
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (registerForm.password !== registerForm.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive'
      });
      return;
    }

    if (!registerForm.email || !registerForm.password || !registerForm.name) {
      toast({
        title: 'Error',
        description: 'Please fill in: Name, Email, and Password',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      await register(
        registerForm.name.trim(),
        registerForm.phone.trim(),
        registerForm.email.trim().toLowerCase(),
        registerForm.password,
        imagePreview || null,
        registerForm.description.trim()
      );
      toast({
        title: 'Success!',
        description: 'Account created successfully! Welcome to SunoSign ✨',
        variant: 'default'
      });
      onSuccess();
    } catch (err) {
      toast({
        title: 'Registration Failed',
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!loginForm.email || !loginForm.password) {
      toast({
        title: 'Error',
        description: 'Please enter email and password',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      await login(loginForm.email.trim().toLowerCase(), loginForm.password);
      toast({
        title: 'Welcome Back!',
        description: 'Logged in successfully 🎉',
        variant: 'default'
      });
      onSuccess();
    } catch (err) {
      toast({
        title: 'Login Failed',
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 overflow-hidden">
      {/* Animated radiant background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-500 to-red-400 opacity-30 blur-3xl animate-pulse-glow" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '2s' }} />
      </div>

      {/* Main container */}
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap className="w-10 h-10 text-purple-500 drop-shadow-lg" />
            <h1 className="text-4xl font-black bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 bg-clip-text text-transparent">
              SunoSign
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">
            Sign Language Recognition • Real-Time Detection
          </p>
        </div>

        {/* Glass card */}
        <Card className="backdrop-blur-xl bg-white/10 dark:bg-black/30 border border-white/20 dark:border-white/10 shadow-2xl">
          <Tabs defaultValue="login" className="w-full">
            {/* Tabs header */}
            <div className="p-6 pb-3">
              <TabsList className="w-full grid grid-cols-2 bg-white/10 dark:bg-black/50 border border-white/20">
                <TabsTrigger 
                  value="login"
                  className="data-[state=active]:shadow-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white"
                >
                  Login
                </TabsTrigger>
                <TabsTrigger 
                  value="register"
                  className="data-[state=active]:shadow-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Login Tab */}
            <TabsContent value="login" className="px-6 pb-6">
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Email */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10 bg-white/5 border-white/20 focus:border-purple-500 focus:bg-white/10 transition-all"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Password
                  </label>
                  <div className="relative">
                    {showPassword ? (
                      <EyeOff 
                        className="absolute left-3 top-3 w-5 h-5 text-gray-400 cursor-pointer"
                        onClick={() => setShowPassword(false)}
                      />
                    ) : (
                      <Eye 
                        className="absolute left-3 top-3 w-5 h-5 text-gray-400 cursor-pointer"
                        onClick={() => setShowPassword(true)}
                      />
                    )}
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pl-10 bg-white/5 border-white/20 focus:border-purple-500 focus:bg-white/10 transition-all"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    />
                  </div>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-6 bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 hover:shadow-xl hover:shadow-purple-500/50 transform hover:scale-105 transition-all font-semibold"
                >
                  {isLoading ? 'Logging in...' : 'Login'}
                </Button>
              </form>
            </TabsContent>

            {/* Register Tab */}
            <TabsContent value="register" className="px-6 pb-6">
              <form onSubmit={handleRegister} className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {/* Profile Image */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                    Profile Picture <span className="text-xs text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="relative w-full h-32 rounded-lg border-2 border-dashed border-white/30 hover:border-cyan-400/60 bg-white/5 hover:bg-white/10 cursor-pointer transition-all flex items-center justify-center group"
                  >
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <div className="text-center">
                        <Image className="w-8 h-8 text-gray-400 mx-auto mb-2 group-hover:text-cyan-400 transition-colors" />
                        <p className="text-xs text-gray-500 group-hover:text-cyan-300 transition-colors">Click to upload</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </div>

                {/* Name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Your Name"
                      className="pl-9 h-9 text-sm bg-white/5 border-white/20 focus:border-cyan-400 focus:bg-white/10 transition-all"
                      value={registerForm.name}
                      onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="+1 (555) 000-0000"
                      className="pl-9 h-9 text-sm bg-white/5 border-white/20 focus:border-cyan-400 focus:bg-white/10 transition-all"
                      value={registerForm.phone}
                      onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      className="pl-9 h-9 text-sm bg-white/5 border-white/20 focus:border-cyan-400 focus:bg-white/10 transition-all"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                    Bio / Description <span className="text-xs text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Tell us about yourself..."
                    className="w-full h-8 px-3 py-1 text-sm rounded-md bg-white/5 border border-white/20 focus:border-cyan-400 focus:bg-white/10 transition-all text-gray-900 dark:text-white placeholder:text-gray-500"
                    value={registerForm.description}
                    onChange={(e) => setRegisterForm({ ...registerForm, description: e.target.value })}
                  />
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="pl-9 h-9 text-sm bg-white/5 border-white/20 focus:border-cyan-400 focus:bg-white/10 transition-all"
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="pl-9 h-9 text-sm bg-white/5 border-white/20 focus:border-cyan-400 focus:bg-white/10 transition-all"
                      value={registerForm.confirmPassword}
                      onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                    />
                  </div>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-4 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 hover:shadow-xl hover:shadow-cyan-500/50 transform hover:scale-105 transition-all font-semibold text-white"
                >
                  {isLoading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
          <p>🤟 Powerful Sign Language Recognition</p>
          <p className="mt-1">Secure • Fast • Accurate</p>
        </div>
      </div>

      {/* Floating elements */}
      <div className="fixed top-10 left-10 w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-2xl opacity-50 animate-pulse" />
      <div className="fixed bottom-10 right-10 w-32 h-32 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl opacity-50 animate-pulse" style={{ animationDelay: '1s' }} />
    </div>
  );
};

export default LoginPage;
