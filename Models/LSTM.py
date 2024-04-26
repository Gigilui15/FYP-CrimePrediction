import pandas as pd
import numpy as np
import os
import joblib
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense
from sklearn.preprocessing import MinMaxScaler
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.models import load_model
from sklearn.metrics import mean_squared_error
import matplotlib.pyplot as plt

# Load your data
data = pd.read_csv('C:\\Users\\luigi\\Desktop\\Third Year\\Thesis\\Artefact\\Data\\train_set.csv', header=0)
data.columns = ['Area', 'Year', 'Month', 'Crime_Category', 'Total_Crimes']

# Drop the 'Year' column since it's not used
data.drop('Year', axis=1, inplace=True)

# Preprocess the data
scaler = MinMaxScaler(feature_range=(0, 1))
scaled_data = scaler.fit_transform(data[['Month', 'Area', 'Crime_Category', 'Total_Crimes']])

# Convert scaled data back to DataFrame for ease of manipulation
scaled_df = pd.DataFrame(scaled_data, columns=['Month', 'Area', 'Crime_Category', 'Total_Crimes'])

scaled_df.sort_values(by=['Month', 'Crime_Category', 'Area'], inplace=True)

# Define the path where you want to save the scaler
directory = r'C:\Users\luigi\Desktop\Third Year\Thesis\Artefact\Data\LSTM'

# Create the directory if it does not exist
if not os.path.exists(directory):
    os.makedirs(directory)

# Define the full path for the scaler file
scaler_path = os.path.join(directory, 'scaler.gz')

# Save the scaler to the specified path
joblib.dump(scaler, scaler_path)

# Define supervised problem
def series_to_supervised(data, n_in=1, n_out=1, dropnan=True):
    n_vars = data.shape[1]
    df = data
    cols, names = list(), list()
    # Input sequence (t-n, ... t-1)
    for i in range(n_in, 0, -1):
        cols.append(df.shift(i))
        names += [('%s(t-%d)' % (df.columns[j], i)) for j in range(n_vars)]
    # Forecast sequence (t, t+1, ... t+n)
    for i in range(0, n_out):
        cols.append(df.shift(-i))
        if i == 0:
            names += [('%s(t)' % (df.columns[j])) for j in range(n_vars)]
        else:
            names += [('%s(t+%d)' % (df.columns[j], i)) for j in range(n_vars)]
    # Put it all together
    agg = pd.concat(cols, axis=1)
    agg.columns = names
    # Drop rows with NaN values
    if dropnan:
        agg.dropna(inplace=True)
    return agg


reframed = series_to_supervised(scaled_df, 1, 1)

# Assume 'reframed' is your final DataFrame after preprocessing and reshaping
n_features = 4  # This should be set to the number of features you're actually using
n_timesteps = 1  # This is the number of lag timesteps you used in your series_to_supervised function

values = reframed.values
X, y = values[:, :-n_features], values[:, -1]  # Adjust depending on your output configuration
X = X.reshape((X.shape[0], n_timesteps, n_features))

# Define LSTM model
model = Sequential()
model.add(LSTM(100, input_shape=(n_timesteps, n_features)))
model.add(Dense(1))  # Assuming a single output node for regression
model.compile(loss='mae', optimizer='adam')

# Fit model
model.fit(X, y, epochs=100, batch_size=90, verbose=2)

# Assume 'model' is your trained LSTM model
model.save('C:\\Users\\luigi\\Desktop\\Third Year\\Thesis\\Artefact\\Data\\LSTM\\lstm_model.h5')

# Load the test set
test_data = pd.read_csv('C:\\Users\\luigi\\Desktop\\Third Year\\Thesis\\Artefact\\Data\\test_set.csv', header=0)
test_data.columns = ['Area', 'Year', 'Month', 'Crime_Category', 'Total_Crimes']

# Convert test data to numeric, handling errors
test_data = test_data.apply(pd.to_numeric, errors='coerce')
test_data.dropna(inplace=True)  # Drop rows with NaN values after conversion

# Drop the 'Year' column as it's not used
test_data.drop('Year', axis=1, inplace=True)

# Load the saved scaler
scaler = joblib.load('C:\\Users\\luigi\\Desktop\\Third Year\\Thesis\\Artefact\\Data\\LSTM\\scaler.gz')

test_scaled = scaler.transform(test_data[['Month', 'Area', 'Crime_Category', 'Total_Crimes']])

# Reshape test data for LSTM [samples, timesteps, features]
test_X = test_scaled.reshape((test_scaled.shape[0], 1, test_scaled.shape[1]))

# Load the trained LSTM model
model = load_model('C:\\Users\\luigi\\Desktop\\Third Year\\Thesis\\Artefact\\Data\\LSTM\\lstm_model.h5')

# Predict using the LSTM model
test_predictions = model.predict(test_X)

# Inverse transform the predictions to get them back to the original scale
# The scaler's inverse_transform method expects the same number of features as it was fit with
# Create a full array with dummy data to match the shape expected by the scaler
dummy_features = np.zeros((test_predictions.shape[0], test_scaled.shape[1] - 1))
full_test_predictions = np.concatenate([dummy_features, test_predictions], axis=1)
final_predictions = scaler.inverse_transform(full_test_predictions)[:, -1]

# Add predictions to the test dataframe for comparison
test_data['Predicted_Crimes'] = final_predictions

# Print the test data with predictions
print(test_data[['Total_Crimes', 'Predicted_Crimes']])

# Calculate Mean Squared Error (MSE)
mse = mean_squared_error(test_data['Total_Crimes'], test_data['Predicted_Crimes'])

# Calculate Root Mean Squared Error (RMSE)
rmse = np.sqrt(mse)

# Print MSE and RMSE
print("Mean Squared Error (MSE):", mse)
print("Root Mean Squared Error (RMSE):", rmse)

# Plotting the actual vs predicted crimes
plt.figure(figsize=(10, 6))
plt.scatter(test_data['Total_Crimes'], test_data['Predicted_Crimes'], alpha=0.5, label='Actual vs Predicted Values')

# Generate a diagonal line (y=x) for perfect predictions
max_val = max(test_data['Total_Crimes'].max(), test_data['Predicted_Crimes'].max())
plt.plot([0, max_val], [0, max_val], 'r--', lw=2, label='Perfect Prediction Line')

plt.title('Actual vs Predicted Values (Test Set)')
plt.xlabel('Actual Values')
plt.ylabel('Predicted Values')
plt.legend()
plt.grid(True)
plt.show()