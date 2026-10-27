import numpy as np
import random
import time

start = time.time()

a =  np.random.randint(1,200,30).reshape(6,5)
# print(a[a>50])
# print(a[a%7==0])

# print(np.arange(3).reshape(3,1) + np.arange(3))
a = np.arange(12).reshape(3,4)
b = np.arange(4)
# print(a+b)

a = np.arange(20).reshape(5,4)
# print(np.shape(a))

b = np.arange(4)
# print(a+b)

#  <=== WORKING WITH MATHEMATICAL FORMULAS ==>

# SIGNOID

def signoid(value):
    return 1 / (1+np.exp(-value))

a = signoid(10)
# print(a)

#  <=== HOW T FIND MEAN SQURE ERROR ===>

actual = np.random.randint(1,200,100)
predicted = np.random.randint(1,200,100)

def mse(actual,predicted):
    return np.mean((actual-predicted)**2)

a = mse(actual,predicted)
# print(a)


#  <=== WORK WITH MISSING VALUES ===>

a = np.array([1,2,3,4,5,np.nan,6,7,8,np.nan,np.nan])
# print(a)
# print(a[~(np.isnan(a))])
# print(np.nanmean(a))
# print(np.mean(a))

count = np.sum(np.isnan(a))
# print(count)

count = 0

for value in a:
    if np.isnan(value):
        count += 1

# print(count)



# <=== GRAPH DROWING WITH NUMPY ===>

import matplotlib.pyplot as plt

# <=== WHEN X = Y ? ===>
# x = np.linspace(-10,10,10)
# y = x
# plt.plot(x,y)
# plt.grid(True)
# plt.title("WHEN X = Y \n")
# plt.xlabel("X")
# plt.ylabel("Y")
# plt.show()


# WHEN Y = X ** 2

# x = np.linspace( -10 , 10 , 10 )
# y = (x)**2
# plt.plot(x,y)
# plt.xlabel("X -- EXIS")
# plt.ylabel("Y -- EXIS")
# plt.title("  Y = X^2  ")
# plt.grid(True)
# plt.show()

# # WHEN Y = sin(x)

# x = np.linspace( -10 , 10 , 10)
# y = np.sin(x)

# plt.plot(x,y)
# plt.xlabel("X")
# plt.ylabel("Y")
# plt.title("WHEN Y = sin(x)")
# plt.grid(True)
# plt.show()


# SIGMOID GRAPH

# x = np.linspace( -10, 10, 100)
# y = 1/(1+np.exp(-x))

# plt.plot(x,y)
# plt.grid(True)
# plt.title(" SIGMOID GRAPH ")
# plt.xlabel("X")
# plt.ylabel("Y")
# plt.show()



# 
# p = np.linspace(0.01, 0.99, 100)

# y = 1
# bce = -(y * np.log(p) + (1-y) * np.log(1-p))

# plt.plot(p, bce)
# plt.xlabel("Predicted Probability (p)")
# plt.ylabel("BCE Loss")
# plt.title("Binary Cross-Entropy Loss (Actual = 1)")
# plt.grid(True)
# plt.show()

# a = [i for i in range(1, 100)]
# b = [i for i in range(100, 200)]

# for i in range(len(a)):
#     c = a[i] + b[i]
#     # print(c)


# start = time.time()
# a = np.arange(1,100)
# b = np.arange(100,199)
# print(a+b)
# print(start - time.time())












# print(start - time.time())