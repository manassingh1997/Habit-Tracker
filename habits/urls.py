from django.urls import path,include
from .views import *



urlpatterns = [
    path('',index,name='index'),
    path('login/',login_page,name='login_page'),
    path('logout/',logout_page,name='logout_page'),
    path('registration/',registration,name='register_page'),
    path('habit/habits/',ListHabit.as_view(),name = "habit-list-create"),
    path('habit/habits/<int:pk>',DetailHabit.as_view(),name = "habit-detail"),
    path('habit/progress/',ListHabitProgress.as_view(),name = "habit-progress-list-create"),
    path('habit/progress/<int:pk>',DetailListHabitProgress.as_view(), name = "habit-progress-detail"),

]