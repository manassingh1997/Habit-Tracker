from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from .models import *
from django.db.models import Q
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from rest_framework import generics,status
from .serializers import HabitSerializer, HabitProgressSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError


# Create your views here.
@login_required
def index(request):
    return render(request,'index.html')

def registration(request):
    # Retrive data from the registration page using POST method
    if request.method == "POST":
        first_name = request.POST.get('first_name')
        last_name = request.POST.get('last_name')
        email = request.POST.get('email')
        password1 = request.POST.get('password1')
        password2 = request.POST.get('password2')
        phone_number = request.POST.get('phone_number')

        #creat object with either email or with phone_number
        habit_user = HabitUser.objects.filter(
            Q(email = email)|Q(phone_number = phone_number)
        )

        #If the user exists already then throwing warning and returning to same page
        if habit_user.exists():
            messages.warning(request,"Account exists with Email or Phone Number")
            return redirect('/registration/')

        # Check if the phone number is 10 digits or not
        if len(phone_number) != 10:
            messages.warning(request,'Phone Number should be 10 digits')
            return redirect('/registration/')

        #Check if the password and confirm password match or not
        if password1 != password2:
            messages.warning(request,'Password and Confirm Password do not match')
            return redirect('/registration/')
        
        # Validate the password
        try:
            validate_password(password1)
        except ValidationError as e:
            for error in e:
                messages.error(request, error)
            return redirect('/registration/')     
           
        habit_user = HabitUser.objects.create(
            first_name = first_name,
            last_name = last_name,
            email = email,
            password = password1,
            phone_number = phone_number,
            username = email,
        )

        habit_user.set_password(password1)
        habit_user.save()
        messages.success(request,"Account Registered")

   
    return render(request,'registration.html')

def login_page(request):
    if request.method == "POST":
        email = request.POST.get('email')
        password = request.POST.get('password')

        #Checking if email exists  or not
        habit_user = HabitUser.objects.filter(email=email)

        if not habit_user.exists():
            messages.warning(request,"User Does Not Exists Please Register")
            return redirect('/login/')
        
        #Checking if userid and password is correct
        habit_user = authenticate(username = habit_user[0].username, password = password)

        #if user is authenticated then user will login
        if habit_user:
            messages.success(request,"login Successfull")
            login(request,habit_user)
            return redirect('/')
        
        messages.warning(request,'Invalid Credentials')

        return redirect('/login/')

    return render(request,'login.html')

def logout_page(request):
    logout(request)
    return redirect('/login/')


#DRF classes
class ListHabit(generics.ListCreateAPIView):
    serializer_class = HabitSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Habit.objects.filter(user = self.request.user)
    
    def perform_create(self,serializer):
        serializer.save(user=self.request.user)

class DetailHabit(generics.RetrieveUpdateDestroyAPIView):
    queryset = Habit.objects.all()
    serializer_class = HabitSerializer

    def get_queryset(self):
        # Return only the habits for the currently logged-in user
        return Habit.objects.filter(user=self.request.user)


    def delete(self,request,*args,**kwargs):
        try:
            habit = self.get_object()
            print("befor delete habit -----",habit)
            habit.delete()
            print("after delete habit -----",habit)
            return Response({'message':'Habit Removed Successfully!','status':'success'},status = status.HTTP_200_OK)
        except Habit.DoesNotExist:
            return Response({'message':'Habit NOT Found','status':'error'},status = status.HTTP_404_NOT_FOUND)
        
class ListHabitProgress(generics.ListCreateAPIView):
    queryset = HabitProgress.objects.all()
    serializer_class = HabitProgressSerializer
    permission_classes = [IsAuthenticated]

class DetailListHabitProgress(generics.RetrieveUpdateDestroyAPIView):
    queryset = HabitProgress.objects.all()
    serializer_class = HabitProgressSerializer

    def delete(self,request,*args,**kwargs):
        try:
            habitProgress = self.get_object()
            habitProgress.delete()
            return Response({'message':'Habit Progress Remove Successfully!','status':'success'},status = status.HTTP_200_ok)
        except Habit.DoesNotExist:
            return Response({'message':'Habit NOT Found','status':'error'},status = status.HTTP_404_NOT_FOUND)
        
