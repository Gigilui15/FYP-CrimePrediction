# %% [markdown]
# Trying to Implement an LSTM for one Agg_id

# %%
import numpy as np
import pandas as pd
import tensorflow as tf
from matplotlib import pyplot as plt
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM
from tensorflow.keras.layers import Dense, Dropout
from sklearn.preprocessing import MinMaxScaler
from keras.wrappers.scikit_learn import KerasRegressor
from sklearn.model_selection import GridSearchCV
from keras.preprocessing.sequence import TimeseriesGenerator
from sklearn.model_selection import train_test_split
from statsmodels.tsa.seasonal import seasonal_decompose
from math import sqrt
from sklearn.metrics import mean_squared_error

# Load the data
train_set = pd.read_csv('C:\\Users\\luigi\\Desktop\\Third Year\\Thesis\\Artefact\\test.csv')

# Create a DateTime attribute from 'year' and 'month' columns
train_set['Date'] = pd.to_datetime(train_set[['year', 'month']].assign(day=1))

# Drop 'year' and 'month' columns if you don't need them anymore
train_set.drop(['year', 'month', 'agg_id', 'area'], axis=1, inplace=True)

# Sort the DataFrame by the DateTime attribute
train_set.sort_values(by='Date', inplace=True)

#Set the Frequency of the data to Monthly
train_set.index.freq='MS'

# Set the 'Date' column as the index
train_set.set_index('Date', inplace=True)

# %%
#Loading the test set
# Load the data
test_set = pd.read_csv('C:\\Users\\luigi\\Desktop\\Third Year\\Thesis\\Artefact\\test_t.csv')

# Create a DateTime attribute from 'year' and 'month' columns
test_set['Date'] = pd.to_datetime(test_set[['year', 'month']].assign(day=1))

# Drop 'year' and 'month' columns if you don't need them anymore
test_set.drop(['year', 'month', 'agg_id', 'area'], axis=1, inplace=True)

# Sort the DataFrame by the DateTime attribute
test_set.sort_values(by='Date', inplace=True)

#Set the Frequency of the data to Monthly
test_set.index.freq='MS'

# Set the 'Date' column as the index
test_set.set_index('Date', inplace=True)

# %%
train_set.head()

# %%
test_set.head()

# %%
train_set.plot(figsize=(12, 6))

# %%
results = seasonal_decompose(train_set['total_crimes'])
results.plot()

# %%
len(train_set)

# %%
train = train_set
test = test_set

# %%
scaler = MinMaxScaler()

# %%
scaler.fit(train)
scaled_train = scaler.transform(train)
scaled_test = scaler.transform(test)

# %%
scaled_train[:10]

# %%
n_input = 12
n_features = 1
generator = TimeseriesGenerator(scaled_train, scaled_train, length=n_input, batch_size=1)

# %%
X,y = generator[0]
print(f'Given the Array: \n{X.flatten()}')
print(f'Predict: \n{y}')

# %%
X.shape

# %%
model = Sequential()
model.add(LSTM(100, activation='relu', input_shape=(n_input, n_features)))
model.add(Dense(1))
model.compile(optimizer='adam', loss='mse')

model.summary()

# %%
#fit the model
model.fit(generator, epochs=50)

# %%
loss_per_epoch = model.history.history['loss']
plt.plot(range(len(loss_per_epoch)), loss_per_epoch)

# %%
last_train_batch = scaled_train[-12:]

last_train_batch = last_train_batch.reshape((1, n_input, n_features))

# %%
model.predict(last_train_batch)

# %%
scaled_test[0]

# %%
test_predictions = []

first_eval_batch = scaled_train[-n_input:]
current_batch = first_eval_batch.reshape((1, n_input, n_features))

for i in range(len(test)):
    #get the prediction value for the first batch
    current_pred = model.predict(current_batch)[0]
    
    #append the prediction into the array
    test_predictions.append(current_pred)
    
    #use the prediction to update the batch and remove the first value
    current_batch = np.append(current_batch[:,1:,:],[[current_pred]],axis=1)

# %%
test_predictions

# %%
true_predictions = scaler.inverse_transform(test_predictions)
test['Predictions'] = true_predictions

# %%
test.plot(figsize=(12,6))

# %%
rmse=sqrt(mean_squared_error(test['total_crimes'],test['Predictions']))
print(rmse)


